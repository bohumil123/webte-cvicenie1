document.querySelectorAll("nav").forEach((nav) => {
    const button = nav.querySelector(".menuToggle");
    if (!button) return;

    const icon = button.querySelector("i");

    button.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("isOpen");

        icon.classList.toggle("bi-list", !isOpen);
        icon.classList.toggle("bi-x-lg", isOpen);

        button.setAttribute("aria-expanded", String(isOpen));
        button.setAttribute("aria-label",
            isOpen ? "Zatvoriť navigáciu" : "Otvoriť navigáciu"
        );
    });
});

// DAY.JS

dayjs.locale("sk");

const today = dayjs();

const dateElement = document.getElementById("currentDate");

if (dateElement) {
    dateElement.textContent = today.format("dddd, D. MMMM YYYY");
    dateElement.dateTime = today.format("YYYY-MM-DD");
}

const currentDay = dayjs().day();

console.log(currentDay);


// MAPA

if (document.getElementById("map")) {

    // Súradnice FEI STU
    const school = [48.151, 17.073];

    // Vytvorenie mapy
    const map = L.map("map").setView(school, 15);

    // OpenStreetMap podklad
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Marker školy
    L.marker(school)
        .addTo(map)
        .bindPopup("FEI STU – Ilkovičova 3");

}



const dayButtons = document.querySelectorAll(".dayButton");

let selectedDay = "all";

function selectDay(day) {

    selectedDay = day;

    dayButtons.forEach((button) => {
        const isSelected = button.dataset.day === selectedDay;

        button.classList.toggle("active", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });

    console.log("Vybraný deň:", selectedDay);
}

dayButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectDay(button.dataset.day);
    });
});

// Predvolený deň podľa aktuálneho dátumu


selectDay(today >= 1 && today <= 5 ? String(today) : "all");