import numpy as np
def uncertanity_ua(scores):
    scores = np.asarray(scores, dtype=float)
    n = scores.size
    if n < 2:
        raise ValueError("At least 2 scores needed")

    mean = np.mean(scores)
    print(mean)
    numerator = np.sum((mean - scores) ** 2)
    u_a_ingredients = (mean - scores) ** 2
    sum_of_squares = np.sum(u_a_ingredients)
    print(numerator)
    u_a = np.sqrt(numerator / (n * (n - 1)))
    return u_a, u_a_ingredients, sum_of_squares

def uncertanity_ub(uncertanity_of_device):
    u_b = uncertanity_of_device / np.sqrt(3)
    return u_b

def uncertanity_c(u_a, u_b):
    u_c = np.sqrt(u_a**2 + u_b**2)
    return u_c

def uncertanity_all(scores, uncertanity_of_device):
    u_a, u_a_ingredients, sum_of_squares = uncertanity_ua(scores)
    u_b = uncertanity_ub(uncertanity_of_device)
    u_c = uncertanity_c(u_a, u_b)
    return u_a, u_b, u_c, u_a_ingredients, sum_of_squares  # tuple: (u_A, u_B, u_C)
