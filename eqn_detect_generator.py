from __future__ import print_function
import sys

# Do not change this
debug = False

# Set debug to True if passed -d on the command line
if len(sys.argv) > 1:
    if sys.argv[1] == "-d":
        debug = True
    else:
        print("I don't know what '{}' means.".format(sys.argv[1]))
        print("Did you mean '-d' (debug)?")
        sys.exit(1)

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
    # elements = elements[:4]
    print("Initial length is", len("|".join(elements)))

# Produce a "stemmed" dictionary of all the element first letters
# with arrays of suffixes
element_dict = {}
for item in elements:
    key = item[0]
    offset = 1
    # Treat Uu differently, since all those elements start with it
    if "Uu" in item:
        key = "Uu"
        offset = 2
    # Add the suffix to the list if it exists, or create the list if it doesn't
    if key in element_dict:
        element_dict[key].append(item[offset:])
    else:
        element_dict[key] = list(item[offset:])

# Turn the dictionary back into an element regex
elements = []
for key in element_dict.keys():
    suffixes = element_dict[key]
    optional = False
    if "" in suffixes:
        optional = True
        suffixes.remove("")
    if debug:
        print(key, suffixes)
    string = key
    if len(suffixes) == 0:
        pass
    elif len(suffixes) == 1:
        if optional:
            string += "|" + key + suffixes[0]
        else:
            string += suffixes[0]
    else:
        string = "{start}[{inner}]{question}".format(
            start=key,
            question=("?" if optional else ""),
            inner="".join(suffixes)
        )
    elements.append(string)

 
# Build a regex for the elements
or_elements = "|".join(elements)
match_elements = "(" + or_elements + ")"

if debug:
    print("Compressed length is", len(or_elements))

# Match the charge: H+, OH-, SO4 2+, etc.
match_charge = r"(\d*[+-])"
# Match the state: (s), (l), (g), (aq)
match_state = r"(\((s|l|g|aq)\))"

# Match the charge and/or state together
# If both are specified, charge must come first
# If there's no (state), the following fallback rules apply:
# If the charge is simply a + or -,  there must be no space, but if there's
# a number (2+, 3-, etc) then there must be a space
match_suffix = r"( ?{charge}? ?{state}| \d+[+-]|[+-]?)".format(
    charge=match_charge,
    state=match_state
)

# Match a token, which is an element and a subscript,
# for example: H2, O2, Na, C6, etc.
match_token = r"({elements}\d*)".format(
    elements=match_elements
)
# The same as match token, but require a subscript,
# this allows us to prevent the capture of single elements on
# their own
match_token_num = r"({elements}\d+)".format(
    elements=match_elements
)

# Match a group of tokens (parenthesis around a part),
# and then an optional subscript
# Note: This will accept malformed strings like:
# ((((OH)2, it's the parser's job to reject this
match_group = r"(\(((({or_elements})\d*)|\(|(\)\d*))+\)\d*)".format(
    or_elements=or_elements
)

# Match a single ion or molecule,
# for example: H2SO4, CO2, H2O, etc.
match_formula = (r"(\d*((({token}*){group}({token}*))|({token}+))" +
                 r"{suffix})").format(
# ({numbered_token}+[+-])
    numbered_token=match_token_num,
    token=match_token,
    suffix=match_suffix,
    group=match_group
)

# Match some number of formulas, seperated by +
match_formulas = r"(?:{formula}( ??\+ ??{formula})*)".format(
    formula=match_formula
)

# Match chemicals and chemical equations
regex = r"/({formulas}(?: ??(<?-+>|<=+>|=) ??{formulas})?)(?=\W)/g".format(
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
print("var chemRegex = " + regex)
