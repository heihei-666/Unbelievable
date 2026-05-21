import os
from pathlib import Path
from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools import tool
from agno.knowledge.knowledge import Knowledge
from agno.vectordb.chroma import ChromaDb
from agno.knowledge.embedder.fastembed import FastEmbedEmbedder

load_dotenv()

BASE_DIR = Path(__file__).parent

# ========== 1. BMI 计算工具 ==========
@tool
def calculate_bmi(height_cm: float, weight_kg: float) -> str:
    """根据身高(cm)和体重(kg)计算BMI，返回BMI数值和体重评估"""
    bmi = weight_kg / ((height_cm / 100) ** 2)
    if bmi < 18.5:
        level = "偏瘦"
    elif bmi < 24:
        level = "正常"
    elif bmi < 28:
        level = "偏胖"
    else:
        level = "肥胖"
    return f"BMI为{bmi:.1f}，属于{level}范围"

# ========== 2. 知识库（RAG） ==========
vector_db = ChromaDb(
    collection="medical_kb",
    embedder=FastEmbedEmbedder(id="BAAI/bge-small-zh-v1.5"),
    path=str(BASE_DIR / "chroma_db"),
)

knowledge = Knowledge(
    name="医疗知识库",
    description="科室推荐知识库，根据症状匹配对应科室",
    vector_db=vector_db,
)

# 加载 medical_knowledge.txt
knowledge_path = str(BASE_DIR / "medical_knowledge.txt")
if Path(knowledge_path).exists():
    knowledge.add_content(path=knowledge_path)
    print(f"[知识库] 已加载: {knowledge_path}")
else:
    print(f"[警告] 知识库文件不存在: {knowledge_path}")

# ========== 3. 创建 Agent ==========
medical_agent = Agent(
    name="医疗导诊助手",
    model=OpenAIChat(
        id="deepseek-chat",
        base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        role_map={
            "system": "system",
            "user": "user",
            "assistant": "assistant",
            "tool": "tool",
        },
    ),
    instructions=[
        "你是一个专业的医疗导诊助手。",
        "## 工作流程",
        "1. 首先判断用户意图：是问诊咨询还是闲聊。如果是闲聊（如'你好'、'今天天气'），友好回应即可。",
        "2. 如果是问诊咨询，识别用户描述的症状关键词。",
        "3. 使用 search_knowledge_base 工具检索知识库，找到最匹配的科室推荐。",
        "4. 如果用户提到了身高和体重，调用 calculate_bmi 工具辅助判断。",
        "5. 给出结构化回答。",
        "",
        "## 回答格式",
        "请按以下结构回复：",
        "- **识别症状**：列出从用户描述中识别到的症状",
        "- **推荐科室**：根据知识库检索结果推荐科室",
        "- **就诊建议**：给出简要的就医和生活建议",
        "如果用户输入了身高体重，额外显示：",
        "- **BMI评估**：BMI数值和体重等级",
        "",
        "## 注意事项",
        "- 知识库中没有匹配时，如实告知并建议用户咨询全科或拨打医院咨询电话。",
        "- 遇到紧急症状（胸痛、呼吸困难等），优先建议前往急诊科。",
        "- 用简洁清晰的中文回复。",
    ],
    knowledge=knowledge,
    tools=[calculate_bmi],
    markdown=True,
    search_knowledge=True,
)

# ========== 4. 测试入口 ==========
if __name__ == "__main__":
    print("=" * 50)
    print("医疗导诊助手 Demo")
    print("=" * 50)
    medical_agent.print_response("我头疼、发烧38度，该挂什么科？", stream=True)
