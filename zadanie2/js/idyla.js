const idylaRestaurant = {
    name: "Idyla Cafe & Restaurant 2",
    url: "https://restauracie.sme.sk/restauracia/idyla-2-cafe-restaurant_1295-karlova-ves_2738/denne-menu",
    coordinates: [48.1538647, 17.0776248]
};

async function loadIdylaMenu() {
    const doc = await loadMenuDocument("data/idyla.html");

    const days = doc.querySelectorAll(".dnesne_menu, .ostatne_menu");

    const foods = [];
    let recognizedDays = 0;

    days.forEach(day => {
        const heading = day.querySelector("h2")?.textContent.trim() ?? "";
        const dayNumber = getDayNumber(heading);

        if (dayNumber === null) return;
        recognizedDays++;
        const date = getMenuDate(heading);

        const items = day.querySelectorAll(".jedlo_polozka .left");
        checkMenuStructure(items.length > 0 || /zatvoren/i.test(day.textContent));

        let pendingText = "";

        items.forEach(item => {
            const text = item.textContent.trim();

            if (!text) return;
            if (/^\d{2}\.\d{2}\.\d{4}$/.test(text)) return;
            if (text === "TÝŽDENNÁ PONUKA JEDÁL") return;
            if (text === "Polievka podľa dennej ponuky") return;
            if (text.toLowerCase() === "zatvorené.") return;

            if (text.toLowerCase().includes("polievka")) {
                foods.push({
                    ...parseFood(text),
                    restaurant: restaurantFilters.Rest1,
                    day: dayNumber,
                    date,
                    type: "soup"
                });

                return;
            }

            pendingText += (pendingText ? " " : "") + text;

            if (/\d+[.,]\d{2}\s*€/.test(text)) {
                foods.push({
                    ...parseFood(pendingText),
                    restaurant: restaurantFilters.Rest1,
                    day: dayNumber,
                    date,
                    type: "main"
                });

                pendingText = "";
            }
        });

        if (pendingText) {
            foods.push({
                ...parseFood(pendingText),
                restaurant: idylaRestaurant.name,
                day: dayNumber,
                date,
                type: "main"
            });
        }
    });

    checkMenuStructure(recognizedDays > 0);
    return foods;
}


