import random

def generate_irish_name(num_words=3, seed=None):
    """Generates a random name by combining Irish historical, mythic, literary, and cultural figures.

    Args:
        num_words (int): The number of words to combine.
        seed (int, optional): A seed for the random number generator.

    Returns:
        str: A string representing the generated name (e.g., "MichaelCollins_SineadOConnor_Balor").
    """

    word_list = [
        "Cuchulainn", "Maeve", "BrianBoru", "OscarWilde", "JamesJoyce",
        "WBYeats", "SaintPatrick", "GraceOMalley", "FionnMacCumhaill",
        "Brendan", "Emer", "Deirdre", "Medb", "Liadin", "Colmcille",
        "JonathanSwift", "SamuelBeckett", "SeamusHeaney", "Enya",
        "DoloresKeane", "Niamh", "Aengus", "Balor", "Dagda",
        "MichaelCollins", "CharlieHaughey", "Bono", "SineadOConnor",
        "VanMorrison", "U2", "LiamNeeson", "PierceBrosnan", "MaryRobinson",
        "MaureenO Hara", "RoddyDoyle", "BrendanGleeson", "Hozier", "SaoirseRonan",
        "GeorgeBernardShaw", "PhilLynott", "TheCranberries", "Jameson", "Guinness"
    ]

    if seed is not None:
        random.seed(seed)

    selected_words = random.sample(word_list, num_words)
    return "_".join(selected_words)

# Example Usage (you'd integrate this into your app):

if __name__ == "__main__": #This makes sure this code only runs when this file is run directly.
    seed_value = 123
    random_name = generate_irish_name(seed=seed_value)
    print(random_name)

    seed_value = 42
    random_name = generate_irish_name(seed=seed_value, num_words=4) #Example of changing number of words.
    print(random_name)