// --- INITIALISATIE ---
document.addEventListener('DOMContentLoaded', () => {
    loadPackages();

    const form = document.getElementById('klantFormulier');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            verwerkBestelling();
        });
    }
    
    const customForm = document.getElementById('customKlantFormulier');
    if (customForm) {
        // Zorgt ervoor dat de prijs direct verandert bij elke toetsaanslag of klik
        customForm.addEventListener('input', berekenPrijs);
        
        customForm.addEventListener('submit', (e) => {
            e.preventDefault();
            verwerkCustomBestelling();
        });
    }

    if (document.getElementById('adminPakketForm')) {
        laadOrdersInAdmin(); 
        const adminForm = document.getElementById('adminPakketForm');
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            voegPakketToe();
        });
        toonPakkettenInAdmin();
    }
});

// --- NIEUWE FUNCTIE: PRIJS BEREKENEN ---
function berekenPrijs() {
    const lengte = parseFloat(document.getElementById('tuinLengte').value) || 0;
    const breedte = parseFloat(document.getElementById('tuinBreedte').value) || 0;
    const oppervlakte = lengte * breedte;
    
    let totaal = 0;
    if (oppervlakte > 0) {
        totaal += 25; // Voorrijkosten/Basis starttarief
    }

    const checkboxes = document.querySelectorAll('input[name="klus"]:checked');
    checkboxes.forEach(cb => {
        if (cb.value === "Betegelen") totaal += (oppervlakte * 25);
        if (cb.value === "Heg snoeien") totaal += 50;
        if (cb.value === "Onkruid verwijderen") totaal += (oppervlakte * 2);
    });

    const prijsDisplay = document.getElementById('totaalBedrag');
    if (prijsDisplay) {
        prijsDisplay.textContent = `€ ${totaal.toLocaleString('nl-NL', {minimumFractionDigits: 2})}`;
    }
    return totaal;
}

// --- BESTAANDE JS FUNCTIES (AANGEPAST VOOR CUSTOM PRIJS) ---

async function loadPackages() {
    let packages = [];
    const storedPackages = localStorage.getItem('tuinPakketten');
    
    if (storedPackages && storedPackages !== "[]") {
        packages = JSON.parse(storedPackages);
    } else {
        try {
            const response = await fetch('packages.json');
            if (!response.ok) throw new Error();
            packages = await response.json();
            localStorage.setItem('tuinPakketten', JSON.stringify(packages)); 
        } catch (error) {
            console.error("Geen JSON gevonden.");
        }
    }
    renderUI(packages);
}

function renderUI(packages) {
    const selectElement = document.getElementById('klantPakket');
    if (selectElement) {
        selectElement.innerHTML = '<option value="" disabled selected>Kies een standaard pakket...</option>';
        packages.forEach(pakket => {
            const option = document.createElement('option');
            option.value = pakket.id; 
            option.textContent = `${pakket.naam} - ${pakket.prijs}`;
            selectElement.appendChild(option);
        });
    }
    
    const container = document.getElementById('pakket-container');
    if (container) {
        container.innerHTML = '';
        packages.forEach(pakket => {
            container.innerHTML += `
                <div class="pakket-kaart">
                    <h3>${pakket.naam}</h3>
                    <div class="prijs">${pakket.prijs}</div>
                    <p>${pakket.beschrijving}</p>
                    <button onclick="selecteerPakket('${pakket.id}')" class="btn-primary">Kies dit pakket</button>
                </div>`;
        });
    }
}

function selecteerPakket(id) {
    const select = document.getElementById('klantPakket');
    if (select) {
        select.value = id;
        document.getElementById('bestelformulier')?.scrollIntoView({ behavior: 'smooth' });
    }
}

function verwerkBestelling() {
    const sel = document.getElementById('klantPakket');
    const orderData = {
        id: Date.now(),
        naam: document.getElementById('klantNaam').value,
        pakket: sel.options[sel.selectedIndex].textContent,
        datum: document.getElementById('klantDatum').value,
        status: 'Standaard'
    };
    saveOrder(orderData);
}

function verwerkCustomBestelling() {
    const klussen = Array.from(document.querySelectorAll('input[name="klus"]:checked')).map(cb => cb.value);
    const prijs = berekenPrijs();

    const orderData = {
        id: Date.now(),
        naam: document.getElementById('klantNaam').value,
        adres: document.getElementById('klantAdres').value,
        werkzaamheden: klussen.join(', '),
        oppervlakte: `${(parseFloat(document.getElementById('tuinLengte').value || 0) * parseFloat(document.getElementById('tuinBreedte').value || 0))} m2`,
        geschattePrijs: `€ ${prijs.toFixed(2)}`,
        datum: document.getElementById('klantDatum').value,
        status: 'Custom Offerte'
    };
    saveOrder(orderData);
}

function saveOrder(orderData) {
    const orders = JSON.parse(localStorage.getItem('tuinOrders') || '[]');
    orders.push(orderData);
    localStorage.setItem('tuinOrders', JSON.stringify(orders));

    const output = document.getElementById('orderOutput');
    if (output) {
        document.getElementById('orderDataDisplay').textContent = JSON.stringify(orderData, null, 2);
        output.style.display = 'block';
    }
    alert("Verzonden naar de administratie!");
}

function laadOrdersInAdmin() {
    const tabel = document.getElementById('orderTabel');
    const orders = JSON.parse(localStorage.getItem('tuinOrders') || '[]');
    if (!tabel) return;
    tabel.innerHTML = '';
    orders.forEach((o, i) => {
        tabel.innerHTML += `<tr><td>${o.datum}</td><td>${o.naam}</td><td>${o.status}</td><td><button onclick="verwijderOrder(${i})">X</button></td></tr>`;
    });
}

function verwijderOrder(i) {
    const orders = JSON.parse(localStorage.getItem('tuinOrders'));
    orders.splice(i, 1);
    localStorage.setItem('tuinOrders', JSON.stringify(orders));
    laadOrdersInAdmin();
}

function voegPakketToe() {
    const p = {
        id: 'PKT' + Date.now(),
        naam: document.getElementById('pakketTitel').value,
        prijs: document.getElementById('pakketPrijs').value,
        beschrijving: document.getElementById('pakketBeschrijving').value
    };
    const pkts = JSON.parse(localStorage.getItem('tuinPakketten') || '[]');
    pkts.push(p);
    localStorage.setItem('tuinPakketten', JSON.stringify(pkts));
    location.reload();
}

function toonPakkettenInAdmin() {
    const div = document.getElementById('pakketBeheerOverzicht');
    const pkts = JSON.parse(localStorage.getItem('tuinPakketten') || '[]');
    if (div) pkts.forEach(p => div.innerHTML += `<p>${p.naam}</p>`);
}