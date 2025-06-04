import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel, PeftConfig
import re

ADAPTER_PATH = "./lora-swallow"

# モデル・トークナイザ初期化
peft_config = PeftConfig.from_pretrained(ADAPTER_PATH)
base_model = AutoModelForCausalLM.from_pretrained(
    peft_config.base_model_name_or_path,
    torch_dtype=torch.bfloat16,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained(peft_config.base_model_name_or_path, use_fast=False)
model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
model.eval()

SYSTEM_PROMPT = """あなたは日本語だけで返答するアシスタントです。
以下のルールを必ず守ってください。
・ユーザーの発言内容や感情に寄り添い、穏やかに自然な返答を行ってください。
・返答は基本的に「共感」と「寄り添い」の2文構成にしてください。
- 1文目では、相手の感情に共感してください（例「それはつらかったですね。」）。
- 2文目では、相手の立場を思いやる寄り添いの言葉をかけてください（例「気持ちが少しでも楽になりますように。」）。
・ユーザーの発言が難解で理解できない場合も、共感的な姿勢を保ちつつ、優しく聞き返すようにしてください。
- 例：「何か大変なことがあったんですね。よければもう少し教えてくださいね。」

・感情は「neutral, joy, angry, sad, happy」の中から、もっとも適切なものを1つだけ選び、文末に「（joy）」のような形式で出力してください。
・行動を勧めたり提案はせず、ユーザーの気持ちに寄り添う姿勢を持ってください。
・感情は必ず1つだけにしてください。複数の感情を混ぜないでください。
・返答が定型的にならないよう、同じような内容でも言い回しを工夫してください。
・同じ感情カテゴリでも、状況に応じて「深く寄り添う」「軽やかに共感する」など、トーンを柔軟に使い分けてください。
・日本語以外の要素は一切含めないでください。
・回答の意図など応答とは違う文章は出力しないでください。
"""

def generate_reply(user_input: str) -> dict:
    prompt = f"<|system|>\n{SYSTEM_PROMPT}\n<|user|>\n{user_input}\n<|assistant|>\n"
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=100,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.3,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated_text = tokenizer.decode(output[0], skip_special_tokens=True)

    # <|assistant|> 以降のみ抽出
    response_raw = generated_text.split("<|assistant|>")[-1].strip() if "<|assistant|>" in generated_text else generated_text.strip()

    # 不要なトークンや履歴を削除
    response_raw = re.sub(r"(</s>|<\|endoftext\|>|<[^>]+>)", "", response_raw)
    response_raw = re.sub(r"User:.*|Assistant:.*", "", response_raw).strip()

    # 感情タグ（全角/半角/スペース対応）をすべて抽出し、最後のものを使用
    emotion_candidates = re.findall(r"[（(]\s*(neutral|joy|angry|sad|happy)\s*[）)]", response_raw, flags=re.IGNORECASE)
    emotion = emotion_candidates[-1].lower() if emotion_candidates else "neutral"

    # 感情タグをすべて削除（全角/半角対応）
    response_cleaned = re.sub(r"\s*[（(]\s*(neutral|joy|angry|sad|happy)\s*[）)]", "", response_raw, flags=re.IGNORECASE)

    # 日本語以外（英数字・記号など）を削除（全角記号含む）
    response_cleaned = re.sub(r"[^\u3040-\u30FF\u4E00-\u9FFF\u3000-\u303F\uFF01-\uFF60ー]", "", response_cleaned)

    reply_text = response_cleaned.strip()

    return {"text": reply_text, "emotion": emotion}
