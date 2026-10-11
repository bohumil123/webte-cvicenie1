const SEMESTER_START = new Date("2026-09-14");
const SEMESTER_END = new Date("2027-02-13");

const now = new Date();

const totalDuration = SEMESTER_END - SEMESTER_START;
const elapsedDuration = now - SEMESTER_START;

const filterButtons = document.querySelectorAll(".scheduleFilter .filterButton");
const scheduleCells = document.querySelectorAll(".scheduleTable td[data-type]");



document.querySelectorAll("nav").forEach((nav) => {
    const button = nav.querySelector(".menuToggle");

    button.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("isOpen");
        
    });
});



let percentage = (elapsedDuration / totalDuration) * 100;

if (percentage < 0) percentage = 0;
if (percentage > 100) percentage = 100;

percentage = Math.round(percentage);

const semesterBar = document.getElementById("semesterBar");
const semesterPercent = document.getElementById("semesterPercent");

if (semesterBar && semesterPercent) {
    semesterBar.value = percentage;
    semesterPercent.textContent = percentage + "%";
}

let visibleSubjects = 0;

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const filter = button.dataset.filter;

        filterButtons.forEach((item) => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        scheduleCells.forEach((cell) => {
            if (filter === "all" || cell.dataset.type === filter){
                cell.classList.remove("filtered-out");
                visibleSubjects++;
            }else cell.classList.add("filtered-out");
        });
        if (visibleSubjects === 0) {
            document.querySelector(".Warning").textContent = "Nie sú dostupné žiadne hodiny pre vybraný filter.";
        }else{
            document.querySelector(".Warning").textContent = "";
            visibleSubjects = 0;
        }
        
        updateCurrentClass();
    });
});



function updateCurrentClass() {
    const now = new Date();

    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentWeekTime = currentDay * 1440 + currentTime;

    const subjectInfo = document.querySelector(".subjectInfo");

    let currentSubject = null;
    let nextSubject = null;
    let nextStartTime = null;
    let nextDay = null;
    let smallestDifference = null;

    scheduleCells.forEach((cell) => {
        const startParts = cell.dataset.start.split(":");
        const endParts = cell.dataset.end.split(":");

        const startTime = Number(startParts[0]) * 60 + Number(startParts[1]);
        const endTime = Number(endParts[0]) * 60 + Number(endParts[1]);

        const cellDay = Number(cell.dataset.day);

        const isCurrent = cellDay === currentDay && currentTime >= startTime && currentTime < endTime && !cell.classList.contains("filtered-out");

        cell.classList.toggle("current-class", isCurrent);

        if (isCurrent) currentSubject = cell.textContent.trim();

        let cellWeekTime = cellDay * 1440 + startTime;
        let difference = cellWeekTime - currentWeekTime;

        if (difference <= 0) difference += 7 * 1440;

        if (!cell.classList.contains("filtered-out") && (smallestDifference === null || difference < smallestDifference)) {
            smallestDifference = difference;
            nextSubject = cell.textContent.trim();
            nextStartTime = startTime;
            nextDay = cellDay;
        }
    });

    if (!subjectInfo) return;

    if (currentSubject) {
        subjectInfo.textContent = "Teraz prebieha: " + currentSubject;
    } else if (nextSubject) {
        const hours = Math.floor(nextStartTime / 60);
        const minutes = nextStartTime % 60;

        const formattedTime = String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");

        const days = {
            1: "v Pondelok",
            2: "v Utorok",
            3: "v Stredu",
            4: "vo Štvrtok",
            5: "v Piatok"
        };

        subjectInfo.textContent = "Ďalšia hodina je " + nextSubject + " o " + formattedTime + " " + days[nextDay] + ".";
    } else {
        subjectInfo.textContent = "Momentálne neprebieha žiadna výučba.";
    }
}

updateCurrentClass();

setInterval(updateCurrentClass, 60000);




// MAP THINGIES

if (document.getElementById("map")) {
    const map = L.map("map").setView([48.15, 17.11], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);


    const school = {
        name: "FEI STU",
        lat: 48.151,
        lng: 17.073
    };

    const home = {
        name: "Domov",
        lat: 48.082064,
        lng: 18.187140
    };


    const schoolMarker = L.marker([school.lat, school.lng])
        .addTo(map)
        .bindPopup(school.name);

    const homeMarker = L.marker([home.lat, home.lng])
        .addTo(map)
        .bindPopup(home.name);

    const permanentPoints = L.latLngBounds([
        [school.lat, school.lng],
        [home.lat, home.lng]
    ]);
    
    map.fitBounds(permanentPoints, {
        padding: [50, 50]
    });


    const storageKey = "mapPoints";

    const markers = [];
    let savedPoints = [];

    const savedPlacesList = document.getElementById("savedPlaces");
    const targetPlacesList = document.getElementById("targetPlaces");

    let selectedSavedPoint = null;
    let selectedTarget = null;

    const calculateButton = document.getElementById("calculateDistance");
    const distanceResult = document.getElementById("distanceResult");

    let currentLine = null;


    function updateSavedPlacesList() {
        savedPlacesList.innerHTML = "";

        savedPoints.forEach((point, index) => {
            const li = document.createElement("li");
            li.classList.add("savedPlaceItem");

            const nameSpan = document.createElement("span");
            nameSpan.textContent = point.name;
            nameSpan.classList.add("savedPlaceName");

            const selectButton = document.createElement("button");
            selectButton.textContent = "Vybrať";
            selectButton.classList.add("filterButton");

            const removeButton = document.createElement("button");
            removeButton.textContent = "X";
            removeButton.classList.add("removeButton");


            removeButton.addEventListener("click", () => {

                if (selectedSavedPoint === point) {
                    selectedSavedPoint = null;

                    if (currentLine) {
                        map.removeLayer(currentLine);
                        currentLine = null;
                    }

                    distanceResult.textContent = "";

                    markers.forEach((marker) => {
                        marker.unbindTooltip();
                    });

                    schoolMarker.unbindTooltip();
                    homeMarker.unbindTooltip();
                }

                map.removeLayer(markers[index]);

                markers.splice(index, 1);
                savedPoints.splice(index, 1);

                localStorage.setItem(
                    storageKey,
                    JSON.stringify(savedPoints)
                );

                updateSavedPlacesList();
            });


            selectButton.addEventListener("click", () => {
                selectedSavedPoint = point;
                

                const buttons = savedPlacesList.querySelectorAll(".filterButton");

                buttons.forEach((button) => {
                    button.classList.remove("active");
                });
            
                selectButton.classList.add("active");

                map.flyTo([point.lat, point.lng], 15);

                console.log(
                    "Vybrané uložené miesto:",
                    selectedSavedPoint
                );
            });


            li.appendChild(nameSpan);
            li.appendChild(selectButton);
            li.appendChild(removeButton);

            savedPlacesList.appendChild(li);
        });
    }


    function updateTargetPlacesList() {
        targetPlacesList.innerHTML = "";

        const targets = [school, home];

        targets.forEach((target) => {
            const li = document.createElement("li");
            li.classList.add("savedPlaceItem");

            const nameSpan = document.createElement("span");
            nameSpan.textContent = target.name;
            nameSpan.classList.add("savedPlaceName");

            const selectButton = document.createElement("button");
            selectButton.textContent = "Vybrať";
            selectButton.classList.add("filterButton");


            selectButton.addEventListener("click", () => {
                selectedTarget = target;

                const buttons = targetPlacesList.querySelectorAll(".filterButton");

                buttons.forEach((button) => {
                    button.classList.remove("active");
                });

                selectButton.classList.add("active");

                map.flyTo([target.lat, target.lng], 15);

                console.log(
                    "Vybraný cieľ:",
                    selectedTarget
                );
            });


            li.appendChild(nameSpan);
            li.appendChild(selectButton);

            targetPlacesList.appendChild(li);
        });
    }


    updateTargetPlacesList();


    map.on("click", function (event) {
        const { lat, lng } = event.latlng;

        const name = prompt("Zadajte názov bodu:");

        if (name === null) {
            return;
        }

        if (!name) {
            alert("Názov bodu je povinný.");
            return;
        }

        const nameExists = savedPoints.some(
            (point) => point.name === name
        );

        if (nameExists) {
            alert(
                "Bod s týmto názvom už existuje. Zvoľte iný názov."
            );
            return;
        }


        const point = {
            name,
            lat,
            lng
        };

        savedPoints.push(point);

        localStorage.setItem(
            storageKey,
            JSON.stringify(savedPoints)
        );

        const marker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(name);

        markers.push(marker);

        updateSavedPlacesList();
    });


    const storedPoints = localStorage.getItem(storageKey);

    if (storedPoints) {
        savedPoints = JSON.parse(storedPoints);

        savedPoints.forEach((point) => {
            const marker = L.marker([point.lat, point.lng])
                .addTo(map)
                .bindPopup(point.name);

            markers.push(marker);
        });

        updateSavedPlacesList();
    }


    calculateButton.addEventListener("click", () => {

        if (!selectedSavedPoint || !selectedTarget) {
            distanceResult.textContent =
                "Najprv vyberte uložené miesto a cieľ.";

            return;
        }


        const distance = haversineDistance(
            selectedSavedPoint.lat,
            selectedSavedPoint.lng,
            selectedTarget.lat,
            selectedTarget.lng
        );


        distanceResult.textContent =
            "Vzdialenosť: " +
            distance.toFixed(2) +
            " km";


        if (currentLine) {
            map.removeLayer(currentLine);
        }


        markers.forEach((marker) => {
            marker.unbindTooltip();
        });

        schoolMarker.unbindTooltip();
        homeMarker.unbindTooltip();


        currentLine = L.polyline([
            [
                selectedSavedPoint.lat,
                selectedSavedPoint.lng
            ],
            [
                selectedTarget.lat,
                selectedTarget.lng
            ]
        ]).addTo(map);

        map.fitBounds(currentLine.getBounds(), {
            padding: [50, 50]
        });


        const selectedIndex =
            savedPoints.indexOf(selectedSavedPoint);

        const startMarker =
            markers[selectedIndex];


        let targetMarker;

        if (selectedTarget === school) {
            targetMarker = schoolMarker;
        }
        else {
            targetMarker = homeMarker;
        }

        startMarker.bindTooltip(
            selectedSavedPoint.name +
            "<br>Vzdialenosť: " +
            distance.toFixed(2) +
            " km",
            {
                permanent: true
            }
        );


        targetMarker.bindTooltip(
            selectedTarget.name +
            "<br>Vzdialenosť: " +
            distance.toFixed(2) +
            " km",
            {
                permanent: true
            }
        );
    });


    function haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;

        const lat1Rad = lat1 * Math.PI / 180;
        const lat2Rad = lat2 * Math.PI / 180;

        const deltaLat =
            (lat2 - lat1) * Math.PI / 180;

        const deltaLng =
            (lng2 - lng1) * Math.PI / 180;


        const a =
            Math.sin(deltaLat / 2) *
            Math.sin(deltaLat / 2) +

            Math.cos(lat1Rad) *
            Math.cos(lat2Rad) *

            Math.sin(deltaLng / 2) *
            Math.sin(deltaLng / 2);


        const c = 2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

        return R * c;
    }
}