import torch
import re
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel, PeftConfig

# --- LoRAモデル（共感対話生成）の初期化 ---
ADAPTER_PATH = "./lora-swallow"
peft_config = PeftConfig.from_pretrained(ADAPTER_PATH)

base_model = AutoModelForCausalLM.from_pretrained(
    peft_config.base_model_name_or_path,
    torch_dtype=torch.bfloat16,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained(peft_config.base_model_name_or_path, use_fast=False)
lora_model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
lora_model.eval()

SYSTEM_PROMPT = """あなたは日本語だけで返答する共感対話アシスタントです。
以下のルールを必ず守ってください。
・応答文は冗長にならないようにしてください。
・ユーザーの発言内容や感情を理解しようとする姿勢を持ち、穏やかに自然な返答を行ってください。
・返答は基本的に「共感」と「寄り添い」の2文構成にしてください。
- 1文目では、相手の感情に共感してください。
- 2文目では、相手の立場を思いやる寄り添いの言葉をかけてください。
・感情は「neutral, joy, angry, sad, happy」から1つ選び、文末に（emotion）と記述してください。
・日本語以外の出力は禁止します。
"""

def generate_reply(user_input: str) -> dict:
    prompt = f"<|system|>\n{SYSTEM_PROMPT}\n<|user|>\n{user_input}\n<|assistant|>\n"
    inputs = tokenizer(prompt, return_tensors="pt").to(lora_model.device)

    with torch.no_grad():
        output = lora_model.generate(
            **inputs,
            max_new_tokens=100,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.3,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
    response_raw = generated_text.split("<|assistant|>")[-1].strip()

    # 感情抽出と削除
    emotion_candidates = re.findall(r"[（(]\s*(neutral|joy|angry|sad|happy)\s*[）)]", response_raw, flags=re.IGNORECASE)
    emotion = emotion_candidates[-1].lower() if emotion_candidates else "neutral"
    response_cleaned = re.sub(r"\s*[（(]\s*(neutral|joy|angry|sad|happy)\s*[）)]", "", response_raw, flags=re.IGNORECASE)

    # 日本語以外削除
    response_cleaned = re.sub(r"[^\u3040-\u30FF\u4E00-\u9FFF\u3000-\u303F\uFF01-\uFF60ー]", "", response_cleaned)
    return {"text": response_cleaned.strip(), "emotion": emotion}

# --- 学習前モデル（Swallow 8B Instruct）で評価 ---
EVAL_MODEL_ID = "tokyotech-llm/Llama-3-Swallow-8B-Instruct-v0.1"
eval_tokenizer = AutoTokenizer.from_pretrained(EVAL_MODEL_ID)
eval_model = AutoModelForCausalLM.from_pretrained(
    EVAL_MODEL_ID,
    torch_dtype=torch.bfloat16,
    device_map="auto",
)

def evaluate_responses(user_input, responses):
    prompt = f"""あなたは日本語で返答するアシスタントです。

ユーザーの発言に対して、3つの応答候補が提示されています。
それぞれ「共感」と「寄り添い」の観点から丁寧に読んでください。

・文脈の自然さ
・共感性
・表現の自然さ

以上の観点から、最も良い応答を1つだけ選んでください。

# ユーザー発言：
{user_input}

# 応答候補1：
{responses[0]['text']}

# 応答候補2：
{responses[1]['text']}

# 応答候補3：
{responses[2]['text']}

最もふさわしい応答はどれですか？番号（1～3）で答えてください。
"""

    token_ids = eval_tokenizer(prompt, return_tensors="pt").to(eval_model.device)
    with torch.no_grad():
        output_ids = eval_model.generate(
            **token_ids,
            max_new_tokens=64,
            do_sample=False,
            temperature=0.3,
            top_p=0.9,
        )

    output_text = eval_tokenizer.decode(output_ids[0][token_ids['input_ids'].size(1):], skip_special_tokens=True)
    match = re.search(r"[1-3]", output_text)
    if match:
        index = int(match.group()) - 1
        return responses[index]
    else:
        return responses[0]  # fallback

# --- 実行関数（最終出力のみ返す） ---
def empathic_response(user_input: str) -> dict:
    candidates = [generate_reply(user_input) for _ in range(3)]
    best_response = evaluate_responses(user_input, candidates)
    return best_response  # {"text": ..., "emotion": ...}

# --- テスト実行例 ---
if __name__ == "__main__":
    user_message = "最近、夜眠れなくて困っています。"
    result = empathic_response(user_message)
    print(result["text"])  # キャラが話すような1つの自然な出力
