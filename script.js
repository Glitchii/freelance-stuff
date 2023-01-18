function toMM(n = 0, unit = 'mm') {
    switch (unit || (document.querySelector('input[name=unit]:checked')?.value || 'mm').toLowerCase()) {
        case 'in': return n *= 25.4;
        case 'cm': return n *= 10;
        case 'px': return n /= 3.7795275591;
        default: return n;
    }
}

function number(s, d = 2) {
    const string = String(s).replace(/[^.\d]/g, '') ?? 0;
    const number = Number(string);
    return string.includes('.') ? Number(number.toFixed(d)) : number; // No unnecessary decimals
}

function editText(el) {
    el.focus();
    this.value = el.value;
    el.value = '';
    el.value = this.value;
}

addEventListener('DOMContentLoaded', () => {
    const css = (el, styles) => typeof styles === "object" ? Object.assign(el.style, styles) : el.style.cssText = styles;
    const repeat = (n, cb) => [...Array(n)].forEach((_, i) => cb(i));
    const createElement = (tag, prop) => Object.assign(document.createElement(tag), prop);

    const sheet = document.querySelector(".sheet");
    const count = document.querySelector(".count");
    const unitElements = document.querySelectorAll(".unitText");
    const widthElement = document.querySelector("[for=width]+.value>.input");
    const heightElement = document.querySelector("[for=height]+.value>.input");
    const editableElements = document.querySelectorAll('.input');
    const inputs = document.querySelectorAll('.input+.unitText');
    const logoHTML = document.querySelector('.logo').outerHTML;

    // Default values in "mm" units:
    const sheetWidthMM = 210;
    const sheetHeightMM = 297;
    const usableSheetWidthMM = 205;
    const usableSheetHeightMM = 260;
    const minStickerWidthMM = 5;
    const minStickerHeightMM = 5;
    const borderMM = 2;
    const spacingMM = 2;

    function displayStickers() {
        const unit = document.querySelector("[name=unit]:checked").value ?? "mm";
        const width = number(widthElement.value), widthMM = toMM(width, unit);
        const height = number(heightElement.value), heightMM = toMM(height, unit);

        if (!widthElement?.value?.length || !heightElement?.value?.length)
            return alert("Both width and height must be filled in.") +
                editText(document.querySelector('.input:placeholder-shown'));
        if (widthMM > usableSheetWidthMM)
            return alert(`${width}${unit} ${unit !== 'mm' ? `(or ${widthMM}mm)` : ''} is too wide, please use a width value that is not wider than ${usableSheetWidthMM}mm.`) +
                editText(widthElement);
        if (heightMM > usableSheetHeightMM)
            return alert(`${height}${unit} ${unit !== 'mm' ? `(or ${heightMM}mm)` : ''} is too high, please use a height value that is not higher than ${usableSheetHeightMM}mm.`) +
                editText(heightElement);
        if (!width || !height)
            return alert("Width and height must be greater than 0.") +
                editText(Array.from(document.querySelectorAll('.input')).filter(el => number(el.value) == 0)?.[0]);
        if (widthMM < minStickerWidthMM)
            return alert(`${width}${unit} ${unit !== 'mm' ? `(or ${widthMM}mm)` : ''} is too small, please use a width value that is not smaller than ${minStickerWidthMM}mm.`) +
                editText(widthElement);
        if (heightMM < minStickerHeightMM)
            return alert(`${height}${unit} ${unit !== 'mm' ? `(or ${heightMM}mm)` : ''} is too small, please use a height value that is not smaller than ${minStickerHeightMM}mm.`) +
                editText(heightElement);

        const rows = parseInt(usableSheetHeightMM / heightMM);
        const cols = parseInt(usableSheetWidthMM / widthMM);
        const totalStickers = rows * cols;
        const spacingPct = spacingMM / sheetWidthMM * 100;
        const gridWidthMM = (sheetWidthMM - spacingMM);
        const colWidthMM = gridWidthMM / cols;
        const stickerWidthPct = widthMM / colWidthMM * 100;
        const stickerRatio = widthMM / heightMM;

        sheet.style.setProperty("--stickerWidth", stickerWidthPct);
        sheet.style.setProperty("--stickerRatio", stickerRatio);
        sheet.style.setProperty("--padding", `${spacingPct}%`);
        // sheet.style.setProperty("--borderRadius", `${stickerWidthPct < 50 ? 3 : stickerWidthPct < 70 ? 5 : 10}px`);

        css(sheet, {
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            // gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap: `${spacingPct}%`,
            padding: `${spacingPct}%`,
        });

        sheet.innerHTML = logoHTML;
        repeat(totalStickers, () => sheet.append(createElement("div", { className: "sticker" })));
        document.querySelectorAll(`.sticker:nth-of-type(-n+${cols})`).forEach(el => el.classList.add("firstRow"));
        addEventListener('resize', () => sheet.style.setProperty("--logoSpace", `calc(${sheet.querySelector(".logo").offsetHeight}px + 2vh)`));
        dispatchEvent(new Event('resize'));

        count.textContent = totalStickers;
        unitElements.forEach(elUnitSymb => elUnitSymb.textContent = unit);
    };

    for (const unitText of inputs) {
        const input = unitText.previousElementSibling;

        unitText.parentElement.addEventListener('click', e => {
            if (e.target != input)
                editText(input);
        });

        input.addEventListener('input', e => {
            // Update inpput width to fit the value:
            input.style.width = `${input.value.length || 1}ch`;
            const newValue = number(e.target.value);
            const unit = document.querySelector('input[name="unit"]:checked').value;

            if (e.target == inputs[0].previousElementSibling && toMM(newValue) > usableSheetWidthMM) {
                var msg = `${newValue}${unit}${unit !== 'mm' ? ` (or ${toMM(newValue, unit)}mm) ` : ' '}is too wide, please use a width value that is not wider than ${usableSheetWidthMM}mm.`;
                document.body.classList.add('calculations-invalid');
            } else if (e.target == inputs[1].previousElementSibling && toMM(newValue) > usableSheetHeightMM) {
                var msg = `${newValue}${unit}${unit !== 'mm' ? ` (or ${toMM(newValue, unit)}mm) ` : ' '}is too high, please use a height value that is not higher than ${usableSheetHeightMM}mm.`;
                document.body.classList.add('calculations-invalid');
            } else {
                var msg = false;
            }

            if (!msg)
                document.body.classList.remove('calculations-invalid', 'invalid');
            else {
                setTimeout(() => {
                    if (!document.body.classList.contains('invalid')) {
                        alert(msg);
                        editText(e.target);
                        document.execCommand('selectAll', false, null);
                        document.body.classList.add('invalid');
                    }
                }, 0);
            }
        });
    }

    let oldUnit = document.querySelector('input[name=unit]:checked').value;
    for (const checkbox of document.querySelectorAll('input[name=unit]'))
        checkbox.addEventListener('change', e => {
            const width = number(editableElements[0].value);
            const height = number(editableElements[1].value);
            const unit = e.target.value;

            for (const unitText of document.querySelectorAll('.unitText'))
                unitText.textContent = unit;

            if (oldUnit === 'in' && unit === 'mm')
                editableElements[0].value = number(width * 25.4),
                    editableElements[1].value = number(height * 25.4);
            else if (oldUnit === 'mm' && unit === 'in')
                editableElements[0].value = number(width / 25.4),
                    editableElements[1].value = number(height / 25.4);
            else if (oldUnit === 'in' && unit === 'cm')
                editableElements[0].value = number(width * 2.54),
                    editableElements[1].value = number(height * 2.54);
            else if (oldUnit === 'cm' && unit === 'in')
                editableElements[0].value = number(width / 2.54),
                    editableElements[1].value = number(height / 2.54);
            else if (oldUnit === 'mm' && unit === 'cm')
                editableElements[0].value = number(width / 10),
                    editableElements[1].value = number(height / 10);
            else if (oldUnit === 'cm' && unit === 'mm')
                editableElements[0].value = number(width * 10),
                    editableElements[1].value = number(height * 10);

            oldUnit = unit;
            document.querySelectorAll('.input').forEach(el => el.dispatchEvent(new Event('input')));
        });

    displayStickers();
    document.querySelector('button.calculate').addEventListener('click', displayStickers);
    document.querySelector('input[name=unit]:checked')?.dispatchEvent(new Event('change'));
    document.querySelectorAll('.input')?.forEach(el => el.dispatchEvent(new Event('input')));
});