import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_syntax.py <file>")
        sys.exit(1)
    
    with open(sys.argv[1], 'r') as f:
        content = f.read()
    
    paren_count = 0
    brace_count = 0
    bracket_count = 0
    in_string = None
    escape = False
    string_chars = ['"', "'", '`']
    
    for i, char in enumerate(content):
        if escape:
            escape = False
            continue
        
        if in_string:
            if char == '\\':
                escape = True
            elif char == in_string:
                in_string = None
            continue
        
        if char in string_chars:
            in_string = char
            continue
        
        if char == '(':
            paren_count += 1
        elif char == ')':
            paren_count -= 1
        elif char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
        elif char == '[':
            bracket_count += 1
        elif char == ']':
            bracket_count -= 1
        
        if paren_count < 0 or brace_count < 0 or bracket_count < 0:
            line = content[:i].count('\n') + 1
            print(f"Negative count at char {i}, line {line}:")
            print(f"  paren: {paren_count}, brace: {brace_count}, bracket: {bracket_count}")
            print(f"  Context: {repr(content[max(0,i-30):i+30])}")
            sys.exit(1)
    
    print(f"Final counts: paren={paren_count}, brace={brace_count}, bracket={bracket_count}")
    if paren_count != 0 or brace_count != 0 or bracket_count != 0:
        print("ERROR: Unbalanced parentheses!")
        sys.exit(1)
    else:
        print("OK")

if __name__ == "__main__":
    main()
