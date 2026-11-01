const dragRestaurant = {
    name: "Reštaurácia DRAG",
    url: "https://www.restauracia-drag.sk/denne-menu",
    coordinates: [48.1507777313053, 17.062990074122215]
};

async function loadDragMenu() {
    const doc = await loadMenuDocument("data/drag.html");
    const foods = [];
    let recognizedDays = 0;

    doc.querySelectorAll(".tab-content .tab-pane").forEach(day => {
        const heading = day.querySelector("h2")?.textContent ?? "";
        const dayNumber = getDayNumber(heading);
        if (dayNumber === null) return;
        recognizedDays++;
        const date = getMenuDate(heading);
        checkMenuStructure(day.querySelector(".menu_box_title h3, table")
            || /zatvoren/i.test(day.textContent));

        const soupHeading = Array.from(day.querySelectorAll(".menu_box_title"))
            .find(heading => heading.textContent.trim() === "POLIEVKA");

        let soupText = "";

        for (let node = soupHeading?.nextSibling; node; node = node.nextSibling) {
            if (node.nodeType === 1 && node.classList.contains("menu_box_title")) break;
            soupText += " " + node.textContent;
        }

        if (soupText.trim() && !/zatvoren/i.test(soupText)) {
            foods.push({
                ...parseFood(soupText),
                restaurant: dragRestaurant.name,
                day: dayNumber,
                date,
                type: "soup"
            });
        }

        day.querySelectorAll("table tr").forEach(row => {
            const text = row.cells[0]?.textContent.trim() ?? "";
            if (!text || /zatvoren/i.test(text)) return;

            foods.push({
                ...parseFood(text),
                price: parseFood(row.cells[1]?.textContent ?? "").price,
                restaurant: dragRestaurant.name,
                day: dayNumber,
                date,
                type: "main"
            });
        });
    });

    checkMenuStructure(recognizedDays > 0);
    return foods;
}
