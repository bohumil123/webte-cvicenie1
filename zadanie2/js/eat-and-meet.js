const eatAndMeetRestaurant = {
    name: "Eat & Meet",
    url: "https://eatandmeet.sk/",
    coordinates: [48.1610618, 17.067427]
};

async function loadEatAndMeetMenu() {
    const doc = await loadMenuDocument("data/eat-and-meet.html");
    const foods = [];
    let recognizedDays = 0;

    doc.querySelectorAll(".weak-menu .tab-pane").forEach(day => {
        const dayNumber = Number(day.id.replace("day-", ""));
        if (!dayNames[dayNumber]) return;
        recognizedDays++;
        const date = getMenuDate(day.querySelector("h2, h3")?.textContent ?? "");

        const items = day.querySelectorAll(".menu-body");
        checkMenuStructure(items.length > 0 || !day.textContent.trim()
            || /zatvoren/i.test(day.textContent));

        items.forEach(item => {
            const description = item.querySelector(".desc");
            checkMenuStructure(description || /zatvoren/i.test(item.textContent));
            const text = description?.textContent.trim() ?? "";
            if (!text || /zatvoren/i.test(text)) return;

            const category = item.querySelector(".menu-title h4")?.textContent.trim() ?? "";
            const prices = (item.querySelector(".price")?.textContent ?? "")
                .split("/")
                .map(value => parseFood(value).price);

            foods.push({
                ...parseFood(text),
                price: prices[0] ?? null,
                isicPrice: prices[1] ?? null,
                restaurant: eatAndMeetRestaurant.name,
                day: dayNumber,
                date,
                type: /polievka/i.test(category) ? "soup" : "main"
            });
        });
    });

    checkMenuStructure(recognizedDays > 0);
    return foods;
}
