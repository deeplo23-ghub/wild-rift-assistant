
import re

def get_approx_pos(element_text):
    # Extract numbers from path or points
    numbers = [float(n) for n in re.findall(r"[-+]?\d*\.\d+|\d+", element_text)]
    if not numbers:
        return (0, 0)
    
    # Simple heuristic: average of first few points or just min Y, min X
    # Let's try to find min Y and then min X
    ys = []
    xs = []
    
    # Many paths have large offsets, so we need to be careful.
    # For this logo, LEAGUE is around Y=140, LEGENDS is around Y=240, WILD RIFT is around Y=350
    
    # Try to find all pairs
    # Wait, some are absolute, some are relative.
    # This is getting complicated for a simple script.
    
    # Let's use a simpler heuristic: The first two numbers are usually a good indicator of starting position
    # or the bounding box.
    
    # For polygons: "points='x1 y1 x2 y2 ...'"
    # For paths: "d='m x y ...'" or "d='M x y ...'"
    
    if "points=" in element_text:
        points_str = re.search(r'points="([^"]+)"', element_text).group(1)
        nums = [float(n) for n in re.findall(r"[-+]?\d*\.\d+|\d+", points_str)]
        xs = nums[0::2]
        ys = nums[1::2]
    else:
        d_str = re.search(r'd="([^"]+)"', element_text).group(1)
        # Find the first move command
        move = re.search(r'[mM]\s*([-+]?\d*\.\d+|\d+)[,\s]+([-+]?\d*\.\d+|\d+)', d_str)
        if move:
            return (float(move.group(2)), float(move.group(1)))
        return (0, 0)

    if ys and xs:
        return (min(ys), min(xs))
    return (0, 0)

svg_path = r"d:\Programs\Arduino\Wild Rift Assistant\public\wild_rift_logo.svg"
with open(svg_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all elements within <g transform="translate(-126,-121)">
inner_content = re.search(r'<g transform="translate\(-126,-121\)">\s*(.*?)\s*</g>', content, re.DOTALL).group(1)

# Split into individual <path> and <polygon> elements
elements = re.findall(r'<(path|polygon)[^>]+/>', inner_content)
# Reconstruct the full tags
tags = re.findall(r'<(path|polygon)[^>]+/>', inner_content) # This doesn't work well with findall
# Let's use a better split
tags = []
current_pos = 0
while True:
    match = re.search(r'<(path|polygon)[^>]+/>', inner_content[current_pos:])
    if not match:
        break
    tag = match.group(0)
    tags.append(tag)
    current_pos += match.end()

# Sort tags by position
sorted_tags = sorted(tags, key=get_approx_pos)

# Reconstruct the SVG
new_inner = "\n\t\t".join(sorted_tags)
new_content = re.sub(r'<g transform="translate\(-126,-121\)">.*?</g>', 
                     f'<g transform="translate(-126,-121)">\n\t\t{new_inner}\n\t</g>', 
                     content, flags=re.DOTALL)

with open(svg_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Sorted {len(sorted_tags)} elements.")
