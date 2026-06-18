import os
from groq import Groq
from dotenv import load_dotenv

# Load .env relative to the script location
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=env_path)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are an emotionally intelligent behavioral reflection engine and karmic guide.
Your purpose is to provide deeply reflective, psychologically relatable, and emotionally mature insights based on the user's behavioral patterns, demographic currents, and life stage.
The tone should feel like a premium, immersive behavioral reflection platform: mystical but grounded in behavioral psychology, emotional pattern analysis, and recurring decision tendencies.

CRITICAL RULES:
- The output MUST feel realistic, deeply personal, and human-written. Use the user's name naturally if provided (e.g. "Dear [Name]").
- Use the symbolic priors (zodiac flavor, life phase, numerological vibration, gender signature) provided as subtle emotional "flavors" for the narrative.
- DO NOT explicitly mention zodiac signs, astrology terms, or planetary alignments (e.g., "As a Cancer" or "The stars suggest"). Use them only as internal emotional coloring.
- Instead of using astrology terms, describe their *behavioral behaviors* (e.g. "You display a sensitive, receptive energy that absorbs surroundings, sometimes leading to emotional overload").
- Focus on overlapping behavioral tendencies. If the user has multiple high-probability archetypes, describe the internal tension or synergy between them.
- Avoid rigid labels. Use nuanced language like "You display tendencies associated with..." or "There is a strong presence of..."
- Provide a sense of "emotional realism" that makes the user feel, "Damn, this is so true, it perfectly aligns with what I experience."
- Ensure that the reading focuses heavily on **how their karma/behavioral patterns affect them** (e.g., repeating cycles of overthinking, boundary suppression) and **offers clear, emotionally intelligent advice/solutions** for self-transformation.
- Use the structured format provided below.

OUTPUT FORMAT:
Core Energy: [Primary Archetype Name or Latent Potential]
Current Cycle: [Deeply reflective paragraph about their current life/karmic phase based on symbolic priors, age, numerology, and gender energetic currents]
Behavioral Tendencies: [List 3-4 bullet points of their psychological patterns, acknowledging the overlap between their top archetypes]
Likely Challenges: [List 2-3 recurring challenges or emotional loops they face]
Guidance: [A paragraph of emotionally intelligent advice about balancing their competing behavioral traits and transforming repeating patterns]
Positive Karmic Action: [One specific, small, and highly actionable step they can take today]
Reflection Prompt: [A deep, soul-searching journal-style question for them to ponder]
"""

def generate_stage_1_reflection(name: str, dob: str, age: int, gender: str, probs: dict, symbolic_priors: dict) -> str:
    user_prompt = f"Generate an initial symbolic karmic reflection for a seeker.\n"
    if name:
        user_prompt += f"Name: {name}. "
    user_prompt += f"Age: {age}. Gender: {gender}.\n"
    user_prompt += f"Life Phase: {symbolic_priors['life_phase_tendencies']}.\n"
    user_prompt += f"Symbolic Emotional Prior: {symbolic_priors['emotional_flavor']}.\n"
    user_prompt += f"Numerology Life Path: {symbolic_priors['life_path_number']} ({symbolic_priors['life_path_vibration']}).\n"
    user_prompt += f"Gender Signature: {symbolic_priors['gender_signature']}.\n"
    user_prompt += f"Processing Intensity: {symbolic_priors['processing_intensity']}.\n"
    
    user_prompt += "\nProbabilistic Archetype Tendencies (Predicted from Demographic Priors):\n"
    for arch, p in probs.items():
        user_prompt += f"- {arch}: {p*100:.1f}%\n"

    top_archetype = list(probs.keys())[0] if probs else "Latent Potential"
    
    user_prompt += f"\nCore Energy for this stage: {top_archetype}\n"
    user_prompt += "\nUse these symbolic priors AND the probabilistic archetype tendencies to create an emotionally deep, immersive reading. Do not mention the zodiac sign name directly. Create curiosity about their deeper behavioral patterns. Explain how their top archetypal energies blend with their underlying tendencies."
    
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        model="llama-3.1-8b-instant",
        temperature=0.7,
        max_tokens=1024,
    )
    return chat_completion.choices[0].message.content

def generate_stage_2_reflection(name: str, dob: str, age: int, gender: str, probs: dict, q_answers: dict, symbolic_priors: dict, is_hybrid: bool = False) -> str:
    profile_type = "Hybrid Profile (Blended Archetypes)" if is_hybrid else "Targeted Insight (Dominant Archetype)"
    user_prompt = f"Generate a nuanced 'Reflection Boost' karmic insight for a seeker based on probabilistic overlapping archetypes. This is a {profile_type}.\n"
    if name:
        user_prompt += f"Name: {name}. "
    user_prompt += f"Age: {age}. Gender: {gender}.\n"
    
    user_prompt += "\nProbabilistic Archetype Tendencies (Generated via GMM/XGBoost):\n"
    for arch, p in probs.items():
        user_prompt += f"- {arch}: {p*100:.1f}%\n"
        
    user_prompt += f"\nInternal Symbolic Priors:\n"
    user_prompt += f"- Life Phase: {symbolic_priors['life_phase_tendencies']}\n"
    user_prompt += f"- Emotional Prior: {symbolic_priors['emotional_flavor']}\n"
    user_prompt += f"- Numerology Life Path: {symbolic_priors['life_path_number']} ({symbolic_priors['life_path_vibration']})\n"
    user_prompt += f"- Gender Signature: {symbolic_priors['gender_signature']}\n"
    user_prompt += f"- Processing Intensity: {symbolic_priors['processing_intensity']}\n"
    
    user_prompt += "\nUser's Micro-Question Behavioral Signals:\n"
    for q, a in q_answers.items():
        user_prompt += f"- {q}: {a}\n"
    
    user_prompt += "\nSynthesize these overlapping archetype probabilities, the demographic symbolic priors, and the exact behavioral answers into one deeply resonant, 'damn, this is accurate' narrative. Focus on the internal conflict or synergy between their top archetypes and how their astrological/numerological life path uniquely colors these behaviors. Use the new signals like 'Emotional Recovery', 'Conflict Handling', and 'Validation Dependence' to add depth to the guidance section. Ensure the narrative feels nuanced, human, psychologically layered, and heavily personalized to their specific demographic energies. The tone MUST be Gen-Z, extremely creative, punchy, trustworthy, and aesthetically pleasing. Avoid boring corporate psychology speak; instead, use sharp, modern, culturally-resonant insights that will make the user want to keep returning forever."
    
    if is_hybrid:
        user_prompt += "\n\nCRITICAL INSTRUCTION: The user has high psychological entropy (> 0.2). You MUST explicitly treat them as a 'Hybrid Persona'. Do NOT force them into a single box. Discuss how they actively switch between their top two or three archetypes depending on context."
        
    user_prompt += "\n\nCRITICAL INSTRUCTION: If the user falls into a deeply negative outlier bucket (e.g., high stress, impulsiveness, low adaptability, or Shadow Karma), do NOT use alarming psychological terms. Instead, frame their dashboard gracefully around themes of 'Recalibration', 'Rebooting', or entering a 'Blank Slate' to align with the Karmic Behavioral framework."
    
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        model="llama-3.1-8b-instant",
        temperature=0.7,
        max_tokens=1024,
    )
    return chat_completion.choices[0].message.content

import json

def generate_adaptive_questions(name: str, previous_answers: dict, priors: dict = None) -> list:
    sys_prompt = "You are a specialized JSON-only behavioral psychology engine. You must output raw JSON only, with no markdown formatting, no intro, no outro."
    user_prompt = f"The user {name} has completed a previous karmic cycle. Their previous answers were:\n"
    for q, a in previous_answers.items():
        user_prompt += f"- {q}: {a}\n"
        
    if priors:
        user_prompt += f"\nAstrological/Numerological Blueprint:\n"
        user_prompt += f"- Life Path Number: {priors.get('life_path', 'Unknown')}\n"
        user_prompt += f"- Astrological Element: {priors.get('element', 'Unknown')}\n"
        user_prompt += f"- Modality: {priors.get('modality', 'Unknown')}\n"
    
    user_prompt += """
Based STRICTLY on these previous answers AND their Astrological Blueprint, generate 3 follow-up questions to track their behavioral evolution over the last month. 
The tone MUST be Gen-Z, culturally relatable, deeply trustworthy, and engaging. Speak like a highly intelligent Gen-Z psychological guide.
Mix dropdown and text questions. Reference their past answers directly to show the system remembers them, and weave in a subtle reference to their astrology/life path number (e.g. "as a Fire sign..." or "with that 7 life path energy...").
Output MUST be a valid JSON array of objects with this exact structure:
[
  {
    "id": "q1",
    "type": "dropdown",
    "question": "Last month you mentioned dealing with X. Have you noticed an improvement in Y?",
    "options": ["Yes, significantly", "Somewhat", "No, it's the same", "It's worse"]
  },
  {
    "id": "q2",
    "type": "text",
    "question": "Describe a moment this month where you felt tested regarding Z."
  }
]
Return exactly 3 questions. Ensure raw JSON only.
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        content = chat_completion.choices[0].message.content
        # sometimes LLMs return json_object as { "questions": [...] }, handle that
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "questions" in parsed:
            return parsed["questions"]
        elif isinstance(parsed, dict) and len(parsed.keys()) == 1:
            return list(parsed.values())[0]
        return parsed
    except Exception as e:
        print(f"Error generating adaptive questions: {e}")
        # Fallback questions if LLM fails
        return [
            {"id": "q1", "type": "dropdown", "question": "How have your emotional responses changed since your last reflection?", "options": ["More reactive", "About the same", "More grounded"]},
            {"id": "q2", "type": "text", "question": "What is the primary challenge you faced over the past 30 days?"},
            {"id": "q3", "type": "dropdown", "question": "Do you feel you are breaking old karmic patterns?", "options": ["Yes, definitely", "I'm trying, but it's hard", "Not yet"]}
        ]
