import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel, PeftConfig

# LoRAアダプタのパス（絶対パスが推奨。Djangoから呼ばれるため）
ADAPTER_PATH = "./lora-swallow"

# モデルとトークナイザの初期化（グローバルに一度だけ）
peft_config = PeftConfig.from_pretrained(ADAPTER_PATH)
base_model = AutoModelForCausalLM.from_pretrained(
    peft_config.base_model_name_or_path,
    torch_dtype=torch.bfloat16,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained(peft_config.base_model_name_or_path, use_fast=False)
model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
model.eval()

# システムプロンプト（Django用に定数として定義）
SYSTEM_PROMPT = """あなたは日本語だけで返答するアシスタントです。
以下のルールを必ず守ってください。
・ユーザーの発言内容や感情に寄り添い、共感や励ましを込めた自然な返答を行ってください。
・返答文は丁寧で親しみのある言葉遣いを用いてください。
・感情は「neutral, joy, angry, sad, happy」の中から、もっとも適切なものを1つだけ選び、返答の最後に「（感情）」の形式で出力してください。
・英語やHTMLタグなど、日本語以外の要素は一切含めないでください。
・感情はあくまで1つだけにしてください。複数の感情を混ぜないでください。
・返答が定型的にならないよう、同じような内容でも言い回しを工夫してください。
・同じ感情カテゴリでも、状況に応じて「深く寄り添う」「軽やかに共感する」など、トーンを柔軟に使い分けてください。
"""

def generate_reply(user_input: str) -> str:
    """
    ユーザー入力に対してAI応答を生成する関数
    """
    prompt = f"<|system|>\n{SYSTEM_PROMPT}\n<|user|>\n{user_input}\n<|assistant|>\n"
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=120,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
    
    if "<|assistant|>" in generated_text:
        response = generated_text.split("<|assistant|>")[-1].strip()
    else:
        response = generated_text.strip()

    return response
