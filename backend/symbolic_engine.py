import hashlib

ZODIAC_DATES = [
    ((1, 20), (2, 18), 'Aquarius'), ((2, 19), (3, 20), 'Pisces'), ((3, 21), (4, 19), 'Aries'),
    ((4, 20), (5, 20), 'Taurus'), ((5, 21), (6, 20), 'Gemini'), ((6, 21), (7, 22), 'Cancer'),
    ((7, 23), (8, 22), 'Leo'), ((8, 23), (9, 22), 'Virgo'), ((9, 23), (10, 22), 'Libra'),
    ((10, 23), (11, 21), 'Scorpio'), ((11, 22), (12, 21), 'Sagittarius'), ((12, 22), (1, 19), 'Capricorn')
]

ZODIAC_FLAVOR_MAP = {
    'Aquarius': 'intellectually detached, innovative, but sometimes emotionally distant',
    'Pisces': 'highly empathetic, absorbing surroundings, prone to emotional overload',
    'Aries': 'action-oriented, pioneering, but prone to impulsiveness',
    'Taurus': 'grounded, seeking stability, resistant to rapid emotional shifts',
    'Gemini': 'adaptable, intellectually curious, prone to scattered focus',
    'Cancer': 'emotionally reflective, sensitive, heavily impacted by deep connections',
    'Leo': 'expressive, seeking validation, highly impacted by pride and perception',
    'Virgo': 'analytical, critical of self, seeking order in emotional chaos',
    'Libra': 'seeking harmony, conflict-avoidant, heavily impacted by relational balance',
    'Scorpio': 'intense, transformative, prone to deep emotional recurrence and extremes',
    'Sagittarius': 'freedom-seeking, philosophical, avoiding emotional confinement',
    'Capricorn': 'structured, ambitious, prone to suppressing emotions for responsibility'
}

def get_element_modality(zodiac):
    mapping = {
        'Aries': ('Fire', 'Cardinal'), 'Taurus': ('Earth', 'Fixed'), 'Gemini': ('Air', 'Mutable'),
        'Cancer': ('Water', 'Cardinal'), 'Leo': ('Fire', 'Fixed'), 'Virgo': ('Earth', 'Mutable'),
        'Libra': ('Air', 'Cardinal'), 'Scorpio': ('Water', 'Fixed'), 'Sagittarius': ('Fire', 'Mutable'),
        'Capricorn': ('Earth', 'Cardinal'), 'Aquarius': ('Air', 'Fixed'), 'Pisces': ('Water', 'Mutable'),
        'Unknown': ('Unknown', 'Unknown')
    }
    return mapping.get(zodiac, ('Unknown', 'Unknown'))

LIFE_PATH_VIBRATIONS = {
    1: "initiating, highly independent, and focused on personal breakthroughs and leadership",
    2: "highly sensitive, seeking harmony, and deeply intuitive and cooperative",
    3: "expressive, creative, and navigating emotional self-expression and communication cycles",
    4: "structured, seeking stability, and building solid emotional boundaries and foundations",
    5: "dynamic, freedom-seeking, and processing rapid life transitions and sensual lessons",
    6: "nurturing, deeply responsible, and carrying collective emotional and relational weight",
    7: "analytical, seeking inner truth, and deeply internally focused and spiritual",
    8: "ambitious, power-balancing, and transforming material/emotional lessons and authority",
    9: "compassionate, humanitarian, and finalizing long-term karmic cycles and endings",
    11: "visionary, emotionally charged, and highly sensitive to subtle or unseen energetic channels",
    22: "master builder, balancing vast practical goals with deep inner wisdom and structured karma"
}

def get_zodiac(month: int, day: int) -> str:
    for start, end, sign in ZODIAC_DATES:
        if (month == start[0] and day >= start[1]) or (month == end[0] and day <= end[1]):
            return sign
    return 'Capricorn'

def calculate_life_path(dob_str: str) -> int:
    """
    Computes a stable, deterministic Life Path Number (1-9, or Master Numbers 11, 22)
    using classical digit-sum reduction of the Date of Birth.
    """
    digits = [int(c) for c in dob_str if c.isdigit()]
    if not digits:
        return 5  # mid-range fallback

    total = sum(digits)
    while total > 9:
        if total in (11, 22):
            break
        total = sum(int(c) for c in str(total))
    return total

def generate_symbolic_priors(name: str, dob_str: str, age: int, gender: str = "Unknown"):
    """
    Generates internal emotional priors and symbolic tendencies based on user info.
    Does NOT output a rigid archetype. Excludes Name from numerical calculations.
    """
    try:
        parts = dob_str.split('-')
        if len(parts[-1]) == 4: # DD-MM-YYYY
            month, day = int(parts[1]), int(parts[0])
        else: # YYYY-MM-DD
            month, day = int(parts[1]), int(parts[2])
    except:
        month, day = 1, 1 # fallback
        
    zodiac_sign = get_zodiac(month, day)
    flavor = ZODIAC_FLAVOR_MAP.get(zodiac_sign, 'balanced and seeking equilibrium')
    
    if age < 25:
        life_phase = "identity exploration, emotional uncertainty, and transitioning life structures"
    elif age < 35:
        life_phase = "establishing foundations, deepening commitments, and facing career/relational pressures"
    elif age < 50:
        life_phase = "evaluating past choices, seeking deeper meaning, and structural transformation"
    else:
        life_phase = "synthesizing life experiences, seeking wisdom, and prioritizing emotional peace"

    # Calculate Life Path Numerology
    life_path = calculate_life_path(dob_str)
    life_path_vib = LIFE_PATH_VIBRATIONS.get(life_path, "balanced and seeking equilibrium")

    # Map Numerology to Processing Intensity
    if life_path in (1, 5, 11):
        intensity_flavor = "highly reactive and prone to rapid shifts"
    elif life_path in (4, 7):
        intensity_flavor = "internally focused and slow to process outward changes"
    else:
        intensity_flavor = "moderately balanced between internal reflection and external reaction"

    # Gender energetic signature
    gender_clean = str(gender).strip().lower()
    if gender_clean == 'female':
        gender_signature = "intuitive, receptive yin energy focus, balancing deep emotional wisdom and healing streams"
    elif gender_clean == 'male':
        gender_signature = "action-oriented, boundary-focused yang energy focus, balancing protective drive and structured expressions"
    elif gender_clean == 'non-binary':
        gender_signature = "harmonious, fluid energetic balance, transcending dualistic behavioral loops and creating integration"
    else:
        gender_signature = "synthesized, adaptive energetic balance, integrating multiple structural streams of consciousness"

    element, modality = get_element_modality(zodiac_sign)

    age_group = 'Unknown'
    if age:
        if age <= 21: age_group = '18–21'
        elif age <= 26: age_group = '22–26'
        elif age <= 35: age_group = '27–35'
        elif age <= 50: age_group = '36–50'
        else: age_group = '51+'

    return {
        "zodiac_internal": zodiac_sign,
        "emotional_flavor": flavor,
        "life_phase_tendencies": life_phase,
        "processing_intensity": intensity_flavor,
        "life_path_number": str(life_path),
        "life_path_vibration": life_path_vib,
        "gender_signature": gender_signature,
        "ml_features": {
            "Gender_Feature": gender_clean.capitalize() if gender_clean in ['male', 'female'] else 'Unknown',
            "Age_Group_Feature": age_group,
            "Life_Path": str(life_path),
            "Day_Number": str(day),
            "Zodiac": zodiac_sign,
            "Element": element,
            "Modality": modality
        }
    }
