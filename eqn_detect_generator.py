debug = False

# Load all of the element names from the CSV
elements = []
with open("periodic.csv", "r") as f:
    for line in f:
        symbol = line.split(",")[1].strip()
        elements.append(symbol)

# Sort the elements alphabetically, but put longer strings first
elements = [(e[0], 10-len(e), e) for e in elements]
elements.sort()

if debug:
    print("Element Tuples:", elements, sep="\n")

# Remove the sorting tuples, just strings again
elements = [e for _, _, e in elements]

if debug:
    print("Elements:", " ".join(elements), sep="\n")
    # Shorten for readability while testing
    elements = elements[:4]

# Build a regex for the elements
or_elements = "|".join(elements)
match_elements = "(" + or_elements + ")"

# Match the charge: H+, OH-, SO4 2+, etc.
match_charge = r"((\d+)?(\+|-))"
# Match the state: (s), (l), (g), (aq)
match_state = r"(\((s|l|g|aq)\))"

# Match the charge and state in either order,
# or allow people to omit them entirely.
# Note: This mistakenly accepts charge-state-charge,
# it's the parser's job to catch this
match_suffix = r"( ?({state}? ?{charge}??)|({charge}? ?{state}?))".format(
    charge=match_charge,
    state=match_state
)

# Match a token, which is an element and a subscript,
# for example: H2, O2, Na, C6, etc.
match_token = r"({elements}(\d+)?)".format(
    elements=match_elements
)
# Match a group of tokens (parenthesis around a part).
# Note: This will accept malformed strings like:
# ((((OH)2, it's the parser's job to catch this
match_group = r"(\((({or_elements}(\d+)?)|\(|\)(\d+)?)\)(\d+)?)".format(
    or_elements=or_elements
)

# Match a single ion or molecule,
# for example: H2SO4, CO2, H2O, etc.
match_formula = (r"(\d*({token}+|{token}*{group}{token}*){suffix})").format(
    token=match_token,
    suffix=match_suffix,
    group=match_group
)

# Match some number of formulas, seperated by +
match_formulas = r"({formula}( ??\+ ??{formula})*)".format(
    formula=match_formula
)

# Match chemicals and chemical equations
regex = r"/{formulas}( ??-+> ??{formulas})?/g".format(
    formulas=match_formulas
)

if debug:
    print("Match elements:", match_elements, sep="\n")
    print("Match state:", match_state, sep="\n")
    print("Match charge:", match_charge, sep="\n")
    print("Match suffix:", match_suffix, sep="\n")
    print("Match token:", match_token, sep="\n")
    print("Match group:", match_group, sep="\n")
    print("Match formula:", match_formula, sep="\n")
    print("Match formulas:", match_formulas, sep="\n")
    print()
print(regex)
