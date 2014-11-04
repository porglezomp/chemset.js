state_strings = ['outside', 'count_compound', 'new_token', 'continue_token',
                 'count_token', 'charge', 'charge_wait', 'charge_count', 
                 'charge_end', 'state_wait', 'state', 'yields', 'double', 
                 'bidirectional', 'equilibrium', 'titration', 'error']

with open("chemset.js", "r") as f, open("chemset.pre.min.js", "w") as out:
    text = f.read()
    for i, string in enumerate(state_strings):
        letter = chr(ord("a")+i)
        dic_version = "'{}':".format(string)
        str_version = "'{}'".format(string)
        text = text.replace(dic_version, letter+":")
        text = text.replace(str_version, "'{}'".format(letter))
    out.write(text)
