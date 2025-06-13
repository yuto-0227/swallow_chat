# 比較実験用おうむ返し
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

SYSTEM_PROMPT = """
あなたはおうむ返しして返答するアシスタントです。
以下のルールを必ず守ってください。

・ユーザーの発言をそのままおうむ返ししてください。
・返答は「〜なんですね。」のように語尾を添えて、自然な形で繰り返してください。
・感情は「neutral, joy, angry, sad, happy」の中からもっとも適切なものを1つだけ選び、
  返答文の末尾に「（joy）」のような形式で必ず記述してください。
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
