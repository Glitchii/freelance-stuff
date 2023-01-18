const css = (el, styles) => typeof styles === "object" ? Object.assign(el.style, styles) : el.style.cssText = styles;
const repeat = (n, cb) => [...Array(n)].forEach((_, i) => cb(i));
const createElement = (tag, prop) => Object.assign(document.createElement(tag), prop);

function number(s, d = 1) {
    const string = String(s).replace(/[^.\d]/g, '') ?? 0;
    const number = Number(string);
    return string.includes('.') ? Number(number.toFixed(d)) : number;
}

function editText(el) {
    el.focus();
    this.value = el.value;
    el.value = '';
    el.value = this.value;
}

function createTooltip(el, msg, callback, after) {
    const tooltip = createElement('div', { textContent: msg });
    tooltip.setAttribute('role', 'tooltip');
    el.parentElement.append(tooltip);
    (window.tooltips ??= []).push({ tooltip, el });

    const setup = () => {
        tooltip.style.left = `${el.offsetLeft + el.offsetWidth / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${el.offsetTop - tooltip.offsetHeight - 10}px`;
        tooltip.style.setProperty('--arrowLeft', `${el.offsetLeft + el.offsetWidth / 2 - tooltip.offsetLeft}px`);
    };

    setup();
    addEventListener('resize', () => {
        if (tooltips.find(t => t.tooltip === tooltip)) setup();
        else removeEventListener('resize', setup);
    });

    if (callback) {
        const interval = setInterval(() => {
            if (callback()) {
                clearInterval(interval);
                tooltip.remove();
                tooltips.splice(tooltips.indexOf({ tooltip, el }), 1);
                after?.();
            }
        }, 100);
    }
}

function convert(value, fromUnit, toUnit) {
    if (fromUnit == toUnit)
        return value;
    else if (fromUnit == 'in' && toUnit == 'mm')
        return number(value * 25.4);
    else if (fromUnit == 'mm' && toUnit == 'in')
        return number(value / 25.4);
    else if (fromUnit == 'in' && toUnit == 'cm')
        return number(value * 2.54);
    else if (fromUnit == 'cm' && toUnit == 'in')
        return number(value / 2.54);
    else if (fromUnit == 'mm' && toUnit == 'cm')
        return number(value / 10);
    else if (fromUnit == 'cm' && toUnit == 'mm')
        return number(value * 10);
}

addEventListener('DOMContentLoaded', () => {
    const sheet = document.querySelector(".sheet");
    const count = document.querySelector(".count");
    const unitElements = document.querySelectorAll(".unitText");
    const widthElement = document.querySelector("[for=width]+.value>.input");
    const heightElement = document.querySelector("[for=height]+.value>.input");
    const editableElements = document.querySelectorAll('.input');
    const inputUnits = document.querySelectorAll('.input+.unitText');
    const logoHTML = document.querySelector('.logo').outerHTML;

    // Default values are in mm
    const sheetWidthMM = 210;
    const sheetHeightMM = 297;
    const usableSheetWidthMM = 205;
    const usableSheetHeightMM = 260;
    const minStickerWidthMM = 5;
    const minStickerHeightMM = 5;
    const borderMM = 2;
    const spacingMM = 2;

    function displayStickers() {
        const unit = document.querySelector("[name=unit]:checked")?.value;
        const width = number(widthElement.value), widthMM = convert(width, unit, 'mm') + borderMM;
        const height = number(heightElement.value), heightMM = convert(height, unit, 'mm') + borderMM;

        if (!widthElement?.value?.length)
            return createTooltip(widthElement, "Width is required", () => widthElement.value.length) + editText(widthElement);
        if (!heightElement?.value?.length)
            return createTooltip(heightElement, "Height is required", () => heightElement.value.length) + editText(heightElement);
        if (widthMM - borderMM > usableSheetWidthMM)
            return createTooltip(widthElement, `${width}${unit} is above the maximum width of ${usableSheetWidthMM}mm`, () => convert(widthElement.value, document.querySelector("[name=unit]:checked")?.value, 'mm') <= usableSheetWidthMM) +
                editText(widthElement);
        if (heightMM - borderMM > usableSheetHeightMM)
            return createTooltip(heightElement, `${height}${unit} is above the maximum height of ${usableSheetHeightMM}mm`, () => convert(heightElement.value, document.querySelector("[name=unit]:checked")?.value, 'mm') <= usableSheetHeightMM) +
                editText(heightElement);
        if (widthMM - borderMM < minStickerWidthMM)
            return createTooltip(widthElement, `Must not be less than ${minStickerWidthMM}mm`, () => convert(widthElement.value, document.querySelector("[name=unit]:checked").value, 'mm') >= minStickerWidthMM) +
                editText(widthElement);
        if (heightMM - borderMM < minStickerHeightMM)
            return createTooltip(heightElement, `Must not be less than ${minStickerHeightMM}mm`, () => convert(heightElement.value, document.querySelector("[name=unit]:checked").value, 'mm') >= minStickerHeightMM) +
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
        document.body.classList.add("calculated");
        addEventListener('resize', () => sheet.style.setProperty("--logoSpace", `calc(${sheet.querySelector(".logo").offsetHeight}px + 2vh)`));
        dispatchEvent(new Event('resize'));

        count.textContent = totalStickers;
        unitElements.forEach(elUnitSymb => elUnitSymb.textContent = unit);
    };

    for (const unitText of inputUnits) {
        const input = unitText.previousElementSibling;

        unitText.parentElement.addEventListener('click', e => {
            if (e.target != input)
                editText(input);
        });

        input.addEventListener('keydown', e => {
            if (e.key.length == 1 && /[^.\d]/g.exec(e.key) && !e.ctrlKey && !e.metaKey)
                e.preventDefault();
            else if (e.key == "Enter" && !document.querySelector('.input:placeholder-shown') && !document.body.classList.contains('invalid'))
                displayStickers();
        });

        input.addEventListener('input', e => {
            input.style.width = `${input.value.length || input.placeholder.length || 0}ch`;
            if (!input.value.length) return;

            const newValue = number(input.value);
            const unit = document.querySelector('input[name="unit"]:checked').value;

            let msg, callback;
            if (input == inputUnits[0].previousElementSibling && convert(newValue, unit, 'mm') > usableSheetWidthMM)
                msg = `Must not be wider than ${convert(usableSheetWidthMM, 'mm', unit)}${unit}`, callback = () => convert(input.value, document.querySelector('input[name="unit"]:checked').value, 'mm') <= usableSheetWidthMM;
            else if (input == inputUnits[1].previousElementSibling && convert(newValue, unit, 'mm') > usableSheetHeightMM)
                msg = `Must not be higher than ${convert(usableSheetHeightMM, 'mm', unit)}${unit}`, callback = () => convert(input.value, document.querySelector('input[name="unit"]:checked').value, 'mm') <= usableSheetHeightMM;
            if (convert(newValue, unit, 'mm') < minStickerWidthMM)
                msg = `Must not be less than ${convert(minStickerWidthMM, 'mm', unit)}${unit}`, callback = () => convert(input.value, document.querySelector('input[name="unit"]:checked').value, 'mm') >= minStickerWidthMM;
            if (number(input.value) < minStickerHeightMM)
                msg = `Must not be less than ${convert(minStickerHeightMM, 'mm', unit)}${unit}`, callback = () => convert(input.value, document.querySelector('input[name="unit"]:checked').value, 'mm') >= minStickerHeightMM;


            msg && document.body.classList.add('invalid');
            msg && createTooltip(e.target, msg, callback, () => !tooltips.length && document.body.classList.remove('invalid'));
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

            editableElements[0]?.value && (editableElements[0].value = convert(width, oldUnit, unit));
            editableElements[1]?.value && (editableElements[1].value = convert(height, oldUnit, unit));
            oldUnit = unit;

            for (const e of document.querySelectorAll('[role="tooltip"')) {
                const input = e.parentElement.querySelector('.input');
                e.remove();
                input.dispatchEvent(new Event('input'));
            }
        });

    document.querySelector('.calculate')?.addEventListener('click', displayStickers);
    document.querySelector('input[name=unit]:checked')?.dispatchEvent(new Event('change'));
    document.querySelectorAll('.input')?.forEach(el => el.dispatchEvent(new Event('input')));
});