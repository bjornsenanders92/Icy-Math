#!/usr/bin/env python3
"""
IcyMath API Server - Programmatically generated questions
Math is calculated by Python, NOT AI - guarantees correct answers!
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import random

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# ═══════════════════════════════════════════════
# QUESTION GENERATORS - Python regner ut svarene
# ═══════════════════════════════════════════════

def shuffle_with_correct(correct, wrongs):
    """Shuffle answers and return list + index of correct answer."""
    answers = [(str(correct), True)] + [(str(w), False) for w in wrongs]
    random.shuffle(answers)
    answer_list = [a[0] for a in answers]
    correct_idx = next(i for i, a in enumerate(answers) if a[1])
    return answer_list, correct_idx


# ─── PROSENT (Percentages) ───
def gen_prosent(diff):
    if diff == 1:
        # Easy: simple percentages of round numbers
        pct = random.choice([10, 20, 25, 50])
        base = random.choice([20, 40, 60, 80, 100, 200, 400, 500])
        ans = int(base * pct / 100)
        wrongs = [ans + random.choice([-10, -5, 5, 10, 15]),
                  int(base / 2), int(base / 4)]
        wrongs = [w for w in wrongs if w != ans][:3]
        while len(wrongs) < 3:
            wrongs.append(ans + random.randint(-20, 20))
        wrongs = list(set(wrongs))[:3]
        while len(wrongs) < 3:
            wrongs.append(ans + len(wrongs) + 1)
        q = f"{pct}% av {base}?"
        return q, ans, wrongs
    elif diff == 2:
        # Medium: percentages with kr or larger numbers
        pct = random.choice([15, 20, 25, 30, 40, 50, 60, 75])
        base = random.choice([200, 240, 300, 360, 400, 480, 500, 600, 800, 1000])
        ans = int(base * pct / 100)
        wrongs = [ans + 10, ans - 10, ans + 20]
        return f"{pct}% av {base}?", ans, wrongs
    else:
        # Hard: discount problems
        kind = random.choice(['rabatt', 'rente', 'okning'])
        if kind == 'rabatt':
            base = random.choice([800, 1000, 1500, 2000, 2500, 3000])
            pct = random.choice([15, 20, 25, 30, 40])
            ans = int(base * (100 - pct) / 100)
            wrongs = [base - pct, ans + 50, ans - 100]
            return f"{base} kr, {pct}% rabatt = ?", f"{ans} kr", [f"{w} kr" for w in wrongs]
        elif kind == 'rente':
            base = random.choice([10000, 20000, 50000, 100000])
            pct = random.choice([3, 4, 5, 6, 8])
            ans = int(base * pct / 100)
            wrongs = [ans + 100, ans - 100, ans * 2]
            return f"{base} kr, {pct}% rente/år = ?", f"{ans} kr", [f"{w} kr" for w in wrongs]
        else:
            base = random.choice([400, 500, 600, 800, 1000])
            pct = random.choice([10, 20, 25, 30])
            ans = int(base * (100 + pct) / 100)
            wrongs = [base + pct, ans - 50, ans + 100]
            return f"{base} + {pct}% = ?", ans, wrongs


# ─── MULT (Multiplication) ───
def gen_mult(diff):
    if diff == 1:
        a = random.randint(2, 10)
        b = random.randint(2, 10)
        ans = a * b
        wrongs = [ans + random.choice([-2, -1, 1, 2, 3]),
                  ans + random.choice([-5, -3, 3, 5]),
                  a + b]
        wrongs = [w for w in set(wrongs) if w != ans and w > 0][:3]
        while len(wrongs) < 3:
            wrongs.append(ans + len(wrongs) + 1)
        return f"{a} × {b}?", ans, wrongs
    elif diff == 2:
        a = random.randint(11, 25)
        b = random.randint(3, 9)
        ans = a * b
        wrongs = [ans + 5, ans - 5, ans + 10]
        return f"{a} × {b}?", ans, wrongs
    else:
        kind = random.choice(['mult', 'div'])
        if kind == 'mult':
            a = random.randint(15, 99)
            b = random.randint(11, 30)
            ans = a * b
            wrongs = [ans + random.randint(10, 50), ans - random.randint(10, 50), ans + 100]
            return f"{a} × {b}?", ans, wrongs
        else:
            b = random.randint(8, 15)
            ans = random.randint(10, 20)
            a = ans * b
            wrongs = [ans + 1, ans - 1, ans + 2]
            return f"{a} ÷ {b}?", ans, wrongs


# ─── TID (Time) ───
def gen_tid(diff):
    if diff == 1:
        kind = random.choice(['min_in_hour', 'hours_in_day', 'days_in_week', 'clock_add'])
        if kind == 'min_in_hour':
            return "Hvor mange minutter er en time?", 60, [30, 45, 100]
        elif kind == 'hours_in_day':
            return "Hvor mange timer er ett døgn?", 24, [12, 48, 7]
        elif kind == 'days_in_week':
            return "Hvor mange dager er en uke?", 7, [5, 14, 10]
        else:
            start = random.randint(1, 8)
            add = random.randint(1, 4)
            ans = start + add
            wrongs = [start - 1, ans + 1, ans + 2]
            return f"Kl {start} + {add} timer?", f"Kl {ans}", [f"Kl {w}" for w in wrongs]
    elif diff == 2:
        kind = random.choice(['min_to_hr', 'hr_to_min', 'work_hours', 'add_hr_min'])
        if kind == 'min_to_hr':
            mins = random.choice([60, 120, 180, 240, 300, 360])
            ans = mins // 60
            wrongs = [ans + 1, ans - 1, ans + 2]
            return f"{mins} minutter = ? timer", ans, wrongs
        elif kind == 'hr_to_min':
            hrs = random.randint(2, 8)
            ans = hrs * 60
            wrongs = [ans - 30, ans + 30, hrs * 100]
            return f"{hrs} timer = ? minutter", ans, wrongs
        elif kind == 'work_hours':
            hpd = random.choice([5, 6, 7, 8, 9])
            days = random.randint(3, 7)
            ans = hpd * days
            wrongs = [ans + days, ans - days, ans + hpd]
            return f"{hpd} timer/dag × {days} dager?", f"{ans}t", [f"{w}t" for w in wrongs]
        else:
            h1 = random.randint(8, 14)
            m1 = random.choice([0, 15, 30, 45])
            h2 = random.randint(1, 3)
            m2 = random.choice([0, 15, 30, 45])
            total_min = h1 * 60 + m1 + h2 * 60 + m2
            ans_h = total_min // 60
            ans_m = total_min % 60
            ans = f"{ans_h:02d}:{ans_m:02d}"
            wrongs = [
                f"{ans_h:02d}:{(ans_m+15)%60:02d}",
                f"{(ans_h-1):02d}:{ans_m:02d}",
                f"{(ans_h+1):02d}:{ans_m:02d}"
            ]
            return f"Kl {h1:02d}:{m1:02d} + {h2}t {m2}min?", ans, wrongs
    else:
        h = random.randint(2, 4)
        m = random.choice([15, 20, 30, 45])
        ans = h * 3600 + m * 60
        wrongs = [ans + 600, ans - 600, ans + 1000]
        return f"{h} timer, {m} min = ? sekunder", ans, wrongs


# ─── HANDEL (Commerce) ───
def gen_handel(diff):
    if diff == 1:
        kind = random.choice(['add', 'sub', 'mult'])
        if kind == 'add':
            a = random.randint(10, 50)
            b = random.randint(10, 50)
            ans = a + b
            wrongs = [ans + 5, ans - 5, ans + 10]
            return f"{a} kr + {b} kr?", f"{ans} kr", [f"{w} kr" for w in wrongs]
        elif kind == 'sub':
            a = random.randint(50, 100)
            b = random.randint(10, 40)
            ans = a - b
            wrongs = [ans + 5, ans - 5, ans + 10]
            return f"{a} kr − {b} kr?", f"{ans} kr", [f"{w} kr" for w in wrongs]
        else:
            n = random.randint(2, 5)
            price = random.choice([10, 15, 20, 25])
            ans = n * price
            wrongs = [ans + 5, ans - 5, ans + 10]
            return f"{n} × {price} kr?", f"{ans} kr", [f"{w} kr" for w in wrongs]
    elif diff == 2:
        n = random.randint(3, 12)
        price = random.choice([15, 20, 25, 35, 45, 55, 75, 125, 180, 250])
        ans = n * price
        wrongs = [ans + 50, ans - 50, ans + 100]
        return f"{n} × {price} kr?", f"{ans} kr", [f"{w} kr" for w in wrongs]
    else:
        kind = random.choice(['kg_pris', 'mnd_kost'])
        if kind == 'kg_pris':
            kg = random.choice([5, 8, 10, 15, 20, 25])
            pris = random.choice([24.50, 32.50, 45.80, 18.75])
            ans = round(kg * pris, 2)
            wrongs = [ans + 50, ans - 50, ans + 25]
            return f"{kg} kg × {pris} kr/kg?", f"{ans} kr", [f"{w} kr" for w in wrongs]
        else:
            mnd_pris = random.choice([350, 429, 599, 799])
            ans = mnd_pris * 12
            wrongs = [ans + 200, ans - 200, ans + 500]
            return f"{mnd_pris} kr/mnd × 12 mnd?", f"{ans} kr", [f"{w} kr" for w in wrongs]


# ─── AREAL (Area) ───
def gen_areal(diff):
    if diff == 1:
        a = random.randint(2, 8)
        b = random.randint(2, 8)
        ans = a * b
        wrongs = [a + b, ans + 2, ans - 2]
        wrongs = [w for w in wrongs if w != ans and w > 0][:3]
        while len(wrongs) < 3:
            wrongs.append(ans + len(wrongs) + 5)
        return f"{a}m × {b}m = ?", f"{ans} m²", [f"{w} m²" for w in wrongs]
    elif diff == 2:
        kind = random.choice(['rect', 'tri', 'omkrets'])
        if kind == 'rect':
            a = random.randint(4, 12)
            b = random.randint(3, 10)
            ans = a * b
            wrongs = [ans + 5, ans - 5, 2*(a+b)]
            return f"Rektangel {a}m × {b}m. Areal?", f"{ans} m²", [f"{w} m²" for w in wrongs]
        elif kind == 'tri':
            base = random.randint(4, 12)
            h = random.randint(3, 10)
            # Ensure even product so triangle area is whole number
            if (base * h) % 2 != 0:
                h = h + 1 if h < 10 else h - 1
            ans = (base * h) // 2
            wrongs = [base * h, ans + 5, ans - 3]
            return f"Trekant b={base}m h={h}m. Areal?", f"{ans} m²", [f"{w} m²" for w in wrongs]
        else:
            a = random.randint(5, 15)
            b = random.randint(3, 10)
            ans = 2 * (a + b)
            wrongs = [a + b, a * b, ans + 4]
            return f"Rektangel {a}m × {b}m. Omkrets?", f"{ans} m", [f"{w} m" for w in wrongs]
    else:
        # Hard: circles or kr/m²
        kind = random.choice(['circle_area', 'price_per_m2'])
        if kind == 'circle_area':
            r = random.randint(3, 10)
            ans = round(3.14 * r * r, 2)
            wrongs = [round(2 * 3.14 * r, 2), ans + 5, ans - 5]
            return f"Sirkel r={r}m. Areal (π≈3,14)?", f"{ans} m²", [f"{w} m²" for w in wrongs]
        else:
            a = random.randint(4, 12)
            b = random.randint(3, 10)
            pris = random.choice([75, 100, 120, 150])
            ans = a * b * pris
            wrongs = [ans + 200, ans - 200, ans + 500]
            return f"{a}m × {b}m, {pris} kr/m²?", f"{ans} kr", [f"{w} kr" for w in wrongs]


# ─── HODE (Mental math) ───
def gen_hode(diff):
    if diff == 1:
        op = random.choice(['+', '-', '*'])
        if op == '+':
            a, b = random.randint(5, 50), random.randint(5, 50)
            ans = a + b
            wrongs = [ans + 1, ans - 1, ans + 2]
            return f"{a} + {b}", ans, wrongs
        elif op == '-':
            a = random.randint(20, 100)
            b = random.randint(5, a-1)
            ans = a - b
            wrongs = [ans + 2, ans - 2, ans + 5]
            return f"{a} − {b}", ans, wrongs
        else:
            a = random.randint(2, 9)
            b = random.randint(2, 9)
            ans = a * b
            wrongs = [ans + 2, ans - 2, ans + 5]
            return f"{a} × {b}", ans, wrongs
    elif diff == 2:
        kind = random.choice(['mult', 'sqrt', 'fraction'])
        if kind == 'mult':
            a = random.choice([12, 15, 18, 25])
            b = random.randint(4, 9)
            ans = a * b
            wrongs = [ans + 5, ans - 5, ans + 10]
            return f"{a} × {b}", ans, wrongs
        elif kind == 'sqrt':
            n = random.choice([4, 9, 16, 25, 36, 49, 64, 81, 100, 144, 169, 196, 225])
            ans = int(n ** 0.5)
            wrongs = [ans + 1, ans - 1, ans + 2]
            return f"√{n}", ans, wrongs
        else:
            base = random.choice([60, 80, 100, 120, 200, 240])
            frac = random.choice([(1, 2), (1, 3), (1, 4), (3, 4), (2, 3)])
            n, d = frac
            if base % d == 0:
                ans = base * n // d
                wrongs = [ans + 5, ans - 5, base // d]
                return f"{n}/{d} av {base}", ans, wrongs
            else:
                # fallback
                ans = base // 2
                return f"½ av {base}", ans, [ans + 5, ans - 5, ans * 2]
    else:
        # Hard: parentheses
        a = random.randint(5, 25)
        b = random.randint(5, 25)
        c = random.randint(2, 10)
        op = random.choice(['mult', 'div'])
        if op == 'mult':
            ans = (a + b) * c
            wrongs = [a + b * c, ans + 10, ans - 10]
            return f"({a}+{b}) × {c}", ans, wrongs
        else:
            total = (a + b) * c  # ensure clean division
            ans = c
            wrongs = [c + 1, c - 1, c + 2]
            return f"({a}+{b}) ÷ {a+b}", 1, [2, 3, 4]  # 1


# ─── STAT (Statistics) ───
def gen_stat(diff):
    if diff == 1:
        kind = random.choice(['avg', 'coin', 'dice'])
        if kind == 'avg':
            nums = sorted([random.randint(1, 20) for _ in range(3)])
            # Ensure clean average
            total = sum(nums)
            while total % 3 != 0:
                nums = sorted([random.randint(1, 20) for _ in range(3)])
                total = sum(nums)
            ans = total // 3
            wrongs = [ans + 1, ans - 1, max(nums)]
            return f"Snitt av {nums[0]}, {nums[1]}, {nums[2]}?", ans, wrongs
        elif kind == 'coin':
            return "Mynt. Sjanse for kron?", "50%", ["25%", "75%", "100%"]
        else:
            return "Terning. Kan du få 7?", "Nei", ["Ja", "Av og til", "Alltid"]
    elif diff == 2:
        kind = random.choice(['avg', 'dice', 'card'])
        if kind == 'avg':
            count = random.choice([3, 4])
            base = random.randint(2, 10)
            nums = [base * (i+1) for i in range(count)]
            ans = sum(nums) // count
            random.shuffle(nums)
            wrongs = [ans + 1, ans - 1, max(nums)]
            return f"Snitt av {', '.join(str(n) for n in nums)}?", ans, wrongs
        elif kind == 'dice':
            return "1 terning. Sjanse for 6?", "1/6", ["1/4", "1/3", "1/2"]
        else:
            return "Kortstokk. Sjanse for hjerter?", "1/4", ["1/2", "1/13", "1/52"]
    else:
        nums = sorted([random.randint(5, 50) for _ in range(5)])
        median = nums[2]
        wrongs = [nums[1], nums[3], nums[0]]
        return f"Median av {', '.join(str(n) for n in nums)}?", median, wrongs


# ═══════════════════════════════════════════════
# CATEGORY DISPATCH
# ═══════════════════════════════════════════════
GENERATORS = {
    'prosent': gen_prosent,
    'mult': gen_mult,
    'tid': gen_tid,
    'handel': gen_handel,
    'areal': gen_areal,
    'hode': gen_hode,
    'stat': gen_stat,
}


@app.route('/api/question', methods=['GET'])
def get_question():
    category = request.args.get('category', 'mult')
    difficulty = int(request.args.get('difficulty', 1))

    if category not in GENERATORS:
        category = random.choice(list(GENERATORS.keys()))

    if difficulty not in [1, 2, 3]:
        difficulty = 1

    try:
        q, correct, wrongs = GENERATORS[category](difficulty)
        # Ensure unique wrongs
        wrongs = [w for w in wrongs if str(w) != str(correct)]
        # Pad with fallback wrongs if needed
        while len(wrongs) < 3:
            if isinstance(correct, (int, float)):
                wrongs.append(correct + len(wrongs) + 1)
            else:
                wrongs.append(f"{correct}_{len(wrongs)}")
        wrongs = wrongs[:3]

        answers, correct_idx = shuffle_with_correct(correct, wrongs)
        return jsonify({
            'q': q,
            'a': answers,
            'c': correct_idx
        })
    except Exception as e:
        print(f"Error generating {category}-{difficulty}: {e}")
        return jsonify({'q': '2 + 2 = ?', 'a': ['4', '3', '5', '6'], 'c': 0})


@app.route('/')
def index():
    with open('mathtower.html', encoding='utf-8') as f:
        return f.read()


if __name__ == '__main__':
    print("\n🎮 IcyMath Math Server")
    print("📍 http://localhost:5000")
    print("✓ Programmatic generation - all answers correct!\n")

    # Quick self-test
    print("Self-testing all generators...")
    for cat in GENERATORS:
        for d in [1, 2, 3]:
            try:
                q, correct, wrongs = GENERATORS[cat](d)
                print(f"  ✓ {cat}-{d}: {q} = {correct}")
            except Exception as e:
                print(f"  ✗ {cat}-{d}: ERROR - {e}")
    print()

    app.run(debug=False, port=5000, host='127.0.0.1')
