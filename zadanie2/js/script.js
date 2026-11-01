

document.querySelectorAll("nav").forEach(nav => {
    const button = nav.querySelector(".menuToggle");
    if (!button) return;

    const icon = button.querySelector("i");

    button.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("isOpen");

        icon.classList.toggle("bi-list", !isOpen);
        icon.classList.toggle("bi-x-lg", isOpen);

        button.setAttribute("aria-expanded", String(isOpen));
        button.setAttribute(
            "aria-label",
            isOpen ? "Zatvoriť navigáciu" : "Otvoriť navigáciu"
        );
    });
});



dayjs.locale("sk");

const today = dayjs();

const dateElement = document.getElementById("currentDate");

if (dateElement) {
    dateElement.textContent = today.format("dddd, D. MMMM YYYY");
    dateElement.dateTime = today.format("YYYY-MM-DD");
}




if (document.getElementById("map")) {
    const school = [48.151, 17.073];

    const map = L.map("map").setView(school, 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker(school)
        .addTo(map)
        .bindPopup("FEI STU");

    const restaurantLocations = {
        Rest1: idylaRestaurant,
        Rest2: dragRestaurant,
        Rest3: eatAndMeetRestaurant
    };

    Object.entries(restaurantLocations).forEach(([id, restaurant]) => {
        const marker = L.marker(restaurant.coordinates)
            .addTo(map)
            .bindPopup(restaurant.name);

        const button = document.querySelector(`.locationButton[data-restaurant="${id}"]`);

        button?.addEventListener("click", () => {
            document.getElementById("map").scrollIntoView({ block: "nearest" });
            map.flyTo(restaurant.coordinates, 17);
            marker.openPopup();
        });
    });
}



let allFoods = [];
let isLoading = false;
const restaurantErrors = new Map();
const restaurantUpdatedAt = new Map();
let storageMessage = "";
const menuSources = [
    { id: "idyla", restaurant: idylaRestaurant, load: loadIdylaMenu },
    { id: "drag", restaurant: dragRestaurant, load: loadDragMenu },
    { id: "eat-and-meet", restaurant: eatAndMeetRestaurant, load: loadEatAndMeetMenu }
];

function menuCacheKey(source) {
    return `menucka-pri-fei:menu:v1:${source.id}`;
}

function showMenuStatus(message) {
    const status = document.getElementById("menuStatus");
    if (!status) return;
    status.textContent = message;
    status.hidden = !message;
}

function readCachedMenu(source) {
    let stored;
    try {
        stored = localStorage.getItem(menuCacheKey(source));
    } catch {
        storageMessage = "Ukladanie dát v prehliadači nie je dostupné. Menu môžete naďalej používať.";
        return null;
    }
    if (!stored) return null;

    try {
        const cached = JSON.parse(stored);
        const timestamp = Date.parse(cached?.updatedAt);
        const validPrice = value => value === null || (Number.isFinite(value) && value >= 0);
        if (cached?.version !== 1 || typeof cached.updatedAt !== "string"
            || !Number.isFinite(timestamp) || timestamp > Date.now()
            || dayjs(timestamp).format("YYYY-MM-DD") !== dayjs().format("YYYY-MM-DD")
            || !Array.isArray(cached.foods)) return null;

        const validFoods = cached.foods.every(food => food
            && food.restaurant === source.restaurant.name
            && typeof food.name === "string"
            && Number.isInteger(food.day) && food.day >= 1 && food.day <= 7
            && ["soup", "main"].includes(food.type)
            && validPrice(food.price)
            && (food.isicPrice === undefined || validPrice(food.isicPrice))
            && (food.portion == null || typeof food.portion === "string")
            && (food.date == null || (typeof food.date === "string"
                && /^\d{4}-\d{2}-\d{2}$/.test(food.date) && Number.isFinite(Date.parse(food.date))))
            && Array.isArray(food.allergens)
            && food.allergens.every(number => Number.isInteger(number) && number >= 1 && number <= 14));
        return validFoods ? cached : null;
    } catch {
        return null;
    }
}

async function loadRestaurantMenu(source, forceReload) {
    const cached = forceReload ? null : readCachedMenu(source);
    if (cached) return cached;

    const foods = await source.load();
    const menu = { version: 1, updatedAt: new Date().toISOString(), foods };
    try {
        localStorage.setItem(menuCacheKey(source), JSON.stringify(menu));
    } catch {
        storageMessage = "Menu sa načítalo, ale nepodarilo sa ho uložiť v prehliadači.";
    }
    return menu;
}

document.getElementById("refreshMenu")?.addEventListener("click", () => initializeMenus(true));
document.getElementById("clearMenuCache")?.addEventListener("click", () => {
    if (isLoading) return;
    try {
        menuSources.forEach(source => localStorage.removeItem(menuCacheKey(source)));
        showMenuStatus("Uložené dáta boli vymazané. Pri ďalšom otvorení stránky sa menu načíta znova.");
    } catch {
        showMenuStatus("Uložené dáta sa nepodarilo vymazať. Úložisko prehliadača nie je dostupné.");
    }
});

const dayButtons = document.querySelectorAll(".dayButtons .dayButton[data-day]");


const currentDay = today.day();

let selectedDay = currentDay >= 1 && currentDay <= 5
    ? String(currentDay)
    : "1";

const dayNames = {
    1: "Pondelok",
    2: "Utorok",
    3: "Streda",
    4: "Štvrtok",
    5: "Piatok",
    6: "Sobota",
    7: "Nedeľa"
};


const restaurantFilters = {
    Rest1: idylaRestaurant.name,
    Rest2: dragRestaurant.name,
    Rest3: eatAndMeetRestaurant.name
};




function selectDay(day) {
    selectedDay = day;

    dayButtons.forEach(button => {
        const isSelected = button.dataset.day === selectedDay;

        button.classList.toggle("active", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });

    renderMenu();
}

dayButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectDay(button.dataset.day);
    });
});




document.querySelectorAll(".filters input[type='checkbox']")
    .forEach(checkbox => {
        checkbox.addEventListener("change", renderMenu);
    });

function getSelectedRestaurants() {
    return Object.entries(restaurantFilters)
        .filter(([id]) => document.getElementById(id)?.checked)
        .map(([, restaurant]) => restaurant);
}




function parseFood(text) {
    const priceMatch = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|EUR\b)/i);
    const allergensMatch = text.match(/\/([\d,\s]+)\/\s*$|\(([\d,\s]+)\)\s*$/);
    const portionPattern = /\b\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?\s*(?:kg|mg|g|ml|cl|dl|l)\b(?:\s*\/\s*\d+(?:[.,]\d+)?\s*(?:kg|mg|g|ml|cl|dl|l)\b)*/gi;
    const portions = text.match(portionPattern) ?? [];
    const portion = portions.length > 0
        ? portions.map(value => value.replace(/\s*\/\s*/g, " / ").trim()).join(" + ")
        : null;

    const price = priceMatch
        ? Number(priceMatch[1].replace(",", "."))
        : null;

    const allergens = allergensMatch
        ? (allergensMatch[1] ?? allergensMatch[2]).split(",").map(Number)
            .filter(number => Number.isInteger(number) && number >= 1 && number <= 14)
        : [];

    const name = text
        .replace(/\d+(?:[.,]\d{1,2})?\s*(?:€|EUR\b)\.?/i, "")
        .replace(/\/[\d,\s]+\/|\([\d,\s]+\)\s*$/g, "")
        .replace(portionPattern, "")
        .replace(/^\d+\.\s*/, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^\.+\s*/, "");

    return { name, price, allergens, portion };
}

function getMenuDate(text) {
    const match = text.match(/\b(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\b/);
    if (!match) return null;

    const [, day, month, year] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (date.getUTCFullYear() !== Number(year)
        || date.getUTCMonth() !== Number(month) - 1
        || date.getUTCDate() !== Number(day)) return null;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function checkMenuStructure(condition) {
    if (!condition) {
        throw new Error("Menu sa nepodarilo spracovať. Štruktúra zdrojovej stránky sa mohla zmeniť.");
    }
}


function getDayNumber(heading) {
    for (const [number, name] of Object.entries(dayNames)) {
        if (heading.includes(name)) {
            return Number(number);
        }
    }

    return null;
}




async function loadMenuDocument(path) {
    let response;
    try {
        response = await fetch(path, { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const html = await response.text();
        return new DOMParser().parseFromString(html, "text/html");
    } catch {
        throw new Error("Menu reštaurácie sa nepodarilo načítať.");
    }
}

const allergenNames = {
    1: "Obilniny obsahujúce lepok",
    2: "Kôrovce",
    3: "Vajcia",
    4: "Ryby",
    5: "Arašidy",
    6: "Sójové zrná",
    7: "Mlieko",
    8: "Orechy",
    9: "Zeler",
    10: "Horčica",
    11: "Sezamové semená",
    12: "Oxid siričitý a siričitany",
    13: "Vlčí bôb",
    14: "Mäkkýše"
};


function createFoodCard(food) {
    const card = document.createElement("article");
    card.className = "card foodCard";

    const isSoup = food.type === "soup";


    card.innerHTML = `
        <div class="card-body">
            <div class="foodType">
                <span></span>
                <i class="bi"></i>
            </div>

            <h4 class="fs-5"></h4>

            <div class="foodDetails">
                <div>
                    <strong></strong>
                </div>

                <div class="allergenWrapper">
                    <button class="btn btn-sm allergenButton"
                            type="button"
                            aria-label="Informácie o alergénoch"
                            aria-expanded="false">
                        <i class="bi bi-info-circle"></i>
                    </button>

                    <div class="allergenPanel" role="tooltip"></div>
                </div>
            </div>
        </div>
    `;

    const typeText = card.querySelector(".foodType span");
    typeText.textContent = isSoup ? "POLIEVKA" : "HLAVNÉ JEDLO";

    const icon = card.querySelector(".foodType i");
    icon.classList.add(
        isSoup ? "bi-cup-hot-fill" : "bi-egg-fried"
    );

    const title = card.querySelector("h4");

    if (food.name.startsWith("PONUKA DŇA:")) {
        const highlight = document.createElement("span");
        highlight.className = "dailySpecial";
        highlight.textContent = "PONUKA DŇA:";

        title.appendChild(highlight);
        title.appendChild(
            document.createTextNode(food.name.replace("PONUKA DŇA:", ""))
        );
    } else {
        title.textContent = food.name;
    }

    card.querySelector("strong").textContent = food.price !== null
        ? `${food.price.toFixed(2)} €`
        : "Cena nie je uvedená";

    if (food.isicPrice != null) {
        const isicPrice = document.createElement("span");
        isicPrice.className = "fw-normal";
        isicPrice.textContent = ` / ${food.isicPrice.toFixed(2)} € (ISIC)`;
        card.querySelector("strong").after(isicPrice);
    }

    if (food.portion) {
        const portion = document.createElement("p");
        portion.className = "mb-0";
        portion.textContent = food.portion;
        card.querySelector(".foodDetails > div").appendChild(portion);
    }

    const allergenButton = card.querySelector(".allergenButton");

    const allergenPanel = card.querySelector(".allergenPanel");

    if (food.allergens.length === 0) {
        allergenPanel.textContent = "Alergény nie sú uvedené.";
    } else {
        food.allergens.forEach(number => {
            const item = document.createElement("p");

            item.textContent =
                `${number}. ${allergenNames[number] ?? "Neznámy alergén"}`;

            allergenPanel.appendChild(item);
        });
    }

    allergenButton.addEventListener("click", () => {
        const isOpen = allergenButton.getAttribute("aria-expanded") === "true";

        closeAllergenPanels();

        allergenButton.setAttribute("aria-expanded", String(!isOpen));
        card.querySelector(".allergenWrapper")
            .classList.toggle("isOpen", !isOpen);
    });

    return card;
}

function closeAllergenPanels() {
    document.querySelectorAll(".allergenWrapper.isOpen").forEach(wrapper => {
        wrapper.classList.remove("isOpen");
        wrapper.querySelector(".allergenButton").setAttribute("aria-expanded", "false");
    });
}

document.addEventListener("click", event => {
    if (!event.target.closest(".allergenWrapper")) {
        closeAllergenPanels();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeAllergenPanels();
    }
});



function renderMenu() {
    const container = document.getElementById("menuContent");
    if (!container) return;

    container.replaceChildren();
    container.setAttribute("aria-busy", String(isLoading));
    if (isLoading) {
        const message = document.createElement("p");
        message.className = "text-secondary";
        message.setAttribute("role", "status");
        message.textContent = "Načítavam menu…";
        container.appendChild(message);
        return;
    }

    const updateLabel = document.getElementById("lastMenuUpdate");
    if (updateLabel) {
        const updatedAt = [...restaurantUpdatedAt.values()]
            .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
        updateLabel.replaceChildren();
        if (updatedAt) {
            const time = document.createElement("time");
            time.dateTime = updatedAt;
            time.textContent = dayjs(updatedAt).format("D. M. YYYY, HH:mm:ss");
            updateLabel.append("Posledná úspešná aktualizácia: ", time);
        } else {
            updateLabel.textContent = "Posledná úspešná aktualizácia nie je k dispozícii.";
        }
        updateLabel.hidden = false;
    }

    const selectedRestaurants = getSelectedRestaurants();

    const filteredFoods = allFoods.filter(food => {
        const matchesDay =
            selectedDay === "all" ||
            food.day === Number(selectedDay);

        const matchesRestaurant =
            selectedRestaurants.includes(food.restaurant);

        return matchesDay && matchesRestaurant;
    });

    const foodCount = document.getElementById("foodCount");

    if (foodCount) {
        foodCount.textContent =
            `Počet jedál: ${filteredFoods.length}`;
    }

    if (selectedRestaurants.length === 0) {
        const message = document.createElement("p");
        message.className = "text-secondary";
        message.textContent = "Vyberte aspoň jednu reštauráciu.";

        container.appendChild(message);
        return;
    }

    menuSources.forEach(({ restaurant }) => {
        if (!selectedRestaurants.includes(restaurant.name)) return;

        const foods = filteredFoods.filter(food => food.restaurant === restaurant.name);
        const error = restaurantErrors.get(restaurant.name);
        const days = error ? [null] : selectedDay === "all"
            ? [...new Set([1, 2, 3, 4, 5, ...foods.map(food => food.day)])].sort((a, b) => a - b)
            : [Number(selectedDay)];

        days.forEach(day => {
            const section = document.createElement("section");
            section.className = "restaurantMenu";

            const heading = document.createElement("h3");
            heading.className = "fs-4";
            const link = document.createElement("a");
            link.href = restaurant.url;
            link.textContent = restaurant.name;
            heading.appendChild(link);
            section.appendChild(heading);

            if (error) {
                const message = document.createElement("p");
                message.className = "text-secondary";
                message.textContent = error;
                section.appendChild(message);
                container.appendChild(section);
                return;
            }

            const dayFoods = foods.filter(food => food.day === day);
            const dayLabel = document.createElement("p");
            dayLabel.className = "text-secondary";
            dayLabel.textContent = dayNames[day];
            const date = dayFoods.find(food => food.date)?.date;
            if (date) {
                const time = document.createElement("time");
                time.dateTime = date;
                time.textContent = dayjs(date).format("D. M. YYYY");
                dayLabel.append(" · ", time);
            }
            section.appendChild(dayLabel);

            if (dayFoods.length === 0) {
                const message = document.createElement("p");
                message.className = "text-secondary";
                message.textContent = "Menu na tento deň nie je k dispozícii.";
                section.appendChild(message);
            } else {
                const grid = document.createElement("div");
                grid.className = "foodGrid";

                dayFoods.forEach(food => {
                    grid.appendChild(createFoodCard(food));
                });
                section.appendChild(grid);
            }

            container.appendChild(section);
        });
    });
}


async function initializeMenus(forceReload = false) {
    if (!document.getElementById("menuContent")) return;
    if (isLoading) return;
    isLoading = true;
    storageMessage = "";
    restaurantErrors.clear();
    const buttons = [document.getElementById("refreshMenu"), document.getElementById("clearMenuCache")];
    buttons.forEach(button => { if (button) button.disabled = true; });
    showMenuStatus("");
    selectDay(selectedDay);

    const menus = await Promise.allSettled(menuSources.map(source => loadRestaurantMenu(source, forceReload)));
    menus.forEach((menu, index) => {
        const restaurant = menuSources[index].restaurant;
        if (menu.status === "rejected") {
            const message = menu.reason?.message;
            restaurantErrors.set(restaurant.name,
                message?.startsWith("Menu") ? message : "Menu reštaurácie sa nepodarilo spracovať.");
        } else {
            restaurantUpdatedAt.set(restaurant.name, menu.value.updatedAt);
        }
    });
    allFoods = menus.flatMap(menu => menu.status === "fulfilled" ? menu.value.foods : []);
    isLoading = false;
    buttons.forEach(button => { if (button) button.disabled = false; });
    showMenuStatus(storageMessage || (forceReload
        ? (restaurantErrors.size ? "Niektoré menu sa nepodarilo aktualizovať. Podrobnosti sú pri reštauráciách." : "Menu bolo aktualizované.")
        : ""));
    renderMenu();
}

initializeMenus();
