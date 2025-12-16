// Initialisatie van de applicatie
document.addEventListener('DOMContentLoaded', () => {
    // Laad pakketten in zowel de dropdown als de grid
    loadPackages();

    // Event listener voor het bestelformulier op index.html
    const form = document.getElementById('klantFormulier');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            verwerkBestelling();
        });
    }
    
    // Event listener voor het custom formulier op custom_offerte.html
    const customForm = document.getElementById('customKlantFormulier');
    if (customForm) {
        customForm.addEventListener('submit', (e) => {
            e.preventDefault();
            verwerkCustomBestelling();
        });
    }

    // Admin Pagina Functies
    if (document.getElementById('adminPakketForm')) {
        // Laad orders in de tabel
        laadOrdersInAdmin(); 
        
        // Event listener voor pakket toevoegen
        const adminForm = document.getElementById('adminPakketForm');
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            voegPakketToe();
        });
        
        // Laad pakketten in de admin weergave voor beheer
        toonPakkettenInAdmin();
    }
});


// --- FUNCTIES VOOR KLANTEN PAGINA (index.html) ---

/**
 * Leest de packages data (eerst uit localStorage, anders uit JSON) en vult de UI.
 */
async function loadPackages() {
    let packages;
    
    // 1. Probeer eerst data uit localStorage te halen (bevat ook custom-toegevoegde pakketten)
    const storedPackages = localStorage.getItem('tuinPakketten');
    if (storedPackages) {
        packages = JSON.parse(storedPackages);
    } else {
        // 2. Als er niets in localStorage staat, laad dan de JSON file
        try {
            const response = await fetch('packages.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            packages = await response.json();
            // Bewaar de startpakketten ook in localStorage
            localStorage.setItem('tuinPakketten', JSON.stringify(packages)); 
        } catch (error) {
            console.error("Fout bij het laden van pakketten:", error);
            packages = [];
        }
    }
    
    // 3. Vul de dropdown (select)
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
    
    // 4. Vul de grid (overzicht)
    const container = document.getElementById('pakket-container');
    if (container) {
        container.innerHTML = '';
        packages.forEach(pakket => {
            const html = `
                <div class="pakket-kaart">
                    <h3>${pakket.naam}</h3>
                    <div class="prijs">${pakket.prijs}</div>
                    <p>${pakket.beschrijving}</p>
                    <button onclick="document.getElementById('klantPakket').value = '${pakket.id}'; document.getElementById('bestelformulier').scrollIntoView({ behavior: 'smooth' });" class="btn-primary" style="font-size: 0.9rem;">Kies dit pakket</button>
                </div>
            `;
            container.innerHTML += html;
        });
    }
}

function verwerkBestelling() {
    // Haal de geselecteerde optie op voor de naam
    const selectedPackageElement = document.getElementById('klantPakket');
    const selectedPackageText = selectedPackageElement.options[selectedPackageElement.selectedIndex].textContent;

    const orderData = {
        id: Date.now(), 
        naam: document.getElementById('klantNaam').value,
        adres: document.getElementById('klantAdres').value,
        postcodePlaats: document.getElementById('klantPostcodePlaats').value,
        datum: document.getElementById('klantDatum').value,
        tijd: document.getElementById('klantTijd').value,
        pakketId: selectedPackageElement.value,
        pakketNaam: selectedPackageText,
        status: 'Nieuwe Aanvraag (Standaard)'
    };

    createOrder(orderData);
}


// --- NIEUWE FUNCTIE VOOR CUSTOM OFFERTE PAGINA (custom_offerte.html) ---

/**
 * Verzamelt formulierdata van het custom formulier en roept createOrder aan.
 */
function verwerkCustomBestelling() {
    // Verzamel geselecteerde checkboxen
    const checkboxes = document.querySelectorAll('#customKlantFormulier input[name="klus"]:checked');
    const geselecteerdeKlussen = Array.from(checkboxes).map(cb => cb.value);

    // Bepaal de lengte en breedte
    const lengte = document.getElementById('tuinLengte').value;
    const breedte = document.getElementById('tuinBreedte').value;
    const oppervlakte = parseFloat(lengte) * parseFloat(breedte);

    const orderData = {
        id: Date.now(), 
        naam: document.getElementById('klantNaam').value,
        adres: document.getElementById('klantAdres').value,
        postcodePlaats: document.getElementById('klantPostcodePlaats').value,
        datum: document.getElementById('klantDatum').value,
        tijd: document.getElementById('klantTijd').value,
        
        // Specifieke custom data
        pakketNaam: 'CUSTOM OFFERTE VRAAG',
        werkzaamheden: geselecteerdeKlussen.join(', ') || 'Geen specifieke klussen geselecteerd',
        afmetingen: `Lengte: ${lengte}m, Breedte: ${breedte}m, Totale Oppervlakte: ${oppervlakte.toFixed(2)} m²`,
        status: 'Nieuwe Offerte Aanvraag'
    };

    createOrder(orderData, true); // Stuur 'true' mee om de output van het custom formulier te tonen
}


// --- GEMEENSCHAPPELIJKE FUNCTIES ---

/**
 * Verwerkt de orderdata: Logt, bewaart in Local Storage en geeft feedback.
 * @param {object} orderData - Het order object.
 * @param {boolean} isCustom - Geeft aan of de aanvraag van het custom formulier komt.
 */
function createOrder(orderData, isCustom = false) {
    console.log("--- Nieuwe Bestelling Ontvangen ---");
    console.log(orderData);
    
    const orders = JSON.parse(localStorage.getItem('tuinOrders') || '[]');
    orders.push(orderData);
    localStorage.setItem('tuinOrders', JSON.stringify(orders));

    const outputDiv = document.getElementById('orderOutput');
    const displayPre = document.getElementById('orderDataDisplay');

    if (outputDiv && displayPre) {
        // Toon de output op de index.html of custom_offerte.html
        displayPre.textContent = JSON.stringify(orderData, null, 2);
        outputDiv.style.display = 'block';
    }

    alert(`Bestelling geplaatst! We komen op ${orderData.datum} om ${orderData.tijd} voor: ${orderData.pakketNaam}`);
    
    // Reset alleen als de formulier-ID bestaat op de huidige pagina
    if (!isCustom && document.getElementById('klantFormulier')) {
         document.getElementById('klantFormulier').reset();
    } else if (isCustom && document.getElementById('customKlantFormulier')) {
         document.getElementById('customKlantFormulier').reset();
    }

    // Herlaad de admin weergave als we op de admin pagina zijn
    if (document.getElementById('orderTabel')) {
        laadOrdersInAdmin();
    }
}


// --- FUNCTIES VOOR ADMIN PAGINA (admin.html) ---

/**
 * Voegt een nieuw pakket toe aan LocalStorage en werkt de weergave bij.
 */
function voegPakketToe() {
    const pakketTitel = document.getElementById('pakketTitel').value;
    const pakketPrijs = document.getElementById('pakketPrijs').value;
    const pakketBeschrijving = document.getElementById('pakketBeschrijving').value;

    const nieuwPakket = {
        id: 'PKT' + Date.now(), // Genereer een unieke ID
        naam: pakketTitel,
        prijs: pakketPrijs,
        beschrijving: pakketBeschrijving
    };

    const pakketten = JSON.parse(localStorage.getItem('tuinPakketten') || '[]');
    pakketten.push(nieuwPakket);
    localStorage.setItem('tuinPakketten', JSON.stringify(pakketten));

    alert(`Pakket '${pakketTitel}' succesvol toegevoegd!`);
    document.getElementById('adminPakketForm').reset();
    
    // Update de weergave op de admin pagina en de klant pagina
    toonPakkettenInAdmin();
    loadPackages(); 
}

/**
 * Toont een overzicht van de pakketten op de admin pagina.
 */
function toonPakkettenInAdmin() {
    const pakketten = JSON.parse(localStorage.getItem('tuinPakketten') || '[]');
    const container = document.getElementById('pakketBeheerOverzicht');

    if (!container) return;
    
    container.innerHTML = '<h4>Huidige Pakketten:</h4>';
    pakketten.forEach(pakket => {
        const item = document.createElement('div');
        item.style.marginBottom = '10px';
        item.innerHTML = `
            <strong>${pakket.naam}</strong> (${pakket.prijs})<br>
            <small>${pakket.beschrijving}</small>
        `;
        container.appendChild(item);
    });
}

function laadOrdersInAdmin() {
    const tabel = document.getElementById('orderTabel');
    const orders = JSON.parse(localStorage.getItem('tuinOrders') || '[]');
    const teller = document.getElementById('orderCount');
    
    if(teller) teller.innerText = orders.length;

    orders.sort((a, b) => new Date(a.datum) - new Date(b.datum));

    if (!tabel) return;

    tabel.innerHTML = '';
    orders.forEach((order, index) => {
        // Pas de weergave aan op basis van custom of standaard order
        const pakketDetails = order.status.includes('Custom') 
            ? `Custom Aanvraag: ${order.werkzaamheden}`
            : order.pakketNaam;

        const row = `
            <tr>
                <td>${order.datum} om ${order.tijd}</td>
                <td><strong>${order.naam}</strong> (${order.postcodePlaats})</td>
                <td>${pakketDetails}</td>
                <td><button onclick="verwijderOrder(${index})" style="background:red; color:white; border:none; padding:5px; cursor:pointer;">X</button></td>
            </tr>
        `;
        tabel.innerHTML += row;
    });
}

function verwijderOrder(index) {
    if(confirm('Weet je zeker dat je deze order wilt verwijderen?')) {
        const orders = JSON.parse(localStorage.getItem('tuinOrders'));
        orders.splice(index, 1);
        localStorage.setItem('tuinOrders', JSON.stringify(orders));
        laadOrdersInAdmin();
    }
}