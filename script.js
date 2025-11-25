// DATA BEHEER
// We controleren of er al pakketten in LocalStorage staan, zo niet, maken we standaarden.
if (!localStorage.getItem('tuinPakketten')) {
    const standaardPakketten = [
        { titel: "Voorjaarsbeurt", prijs: "€250", beschrijving: "Snoeien, bemesten en onkruidvrij maken." },
        { titel: "Wekelijks Onderhoud", prijs: "€45 p/u", beschrijving: "Grasmaaien en kantjes knippen." },
        { titel: "Winterklaar Maken", prijs: "€200", beschrijving: "Bladruimen en planten beschermen." }
    ];
    localStorage.setItem('tuinPakketten', JSON.stringify(standaardPakketten));
}

if (!localStorage.getItem('tuinOrders')) {
    localStorage.setItem('tuinOrders', JSON.stringify([]));
}

// FUNCTIES VOOR KLANTEN PAGINA (index.html)
document.addEventListener('DOMContentLoaded', () => {
    // Alleen uitvoeren als we op de homepagina zijn
    if (document.getElementById('pakket-container')) {
        laadPakketten();
        
        const form = document.getElementById('klantFormulier');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            nieuweAanvraagOpslaan();
        });
    }
    
    // Alleen uitvoeren op admin pagina
    if (document.getElementById('adminPakketForm')) {
        const adminForm = document.getElementById('adminPakketForm');
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            voegPakketToe();
        });
    }
});

function laadPakketten() {
    const container = document.getElementById('pakket-container');
    const pakketten = JSON.parse(localStorage.getItem('tuinPakketten'));
    
    container.innerHTML = ''; // Leegmaken
    pakketten.forEach(pakket => {
        const html = `
            <div class="pakket-kaart">
                <h3>${pakket.titel}</h3>
                <div class="prijs">${pakket.prijs}</div>
                <p>${pakket.beschrijving}</p>
                <button onclick="selecteerPakket('${pakket.titel}')" class="btn-primary" style="font-size: 0.9rem;">Kies dit pakket</button>
            </div>
        `;
        container.innerHTML += html;
    });
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function selecteerPakket(titel) {
    scrollToSection('offerte');
    // Probeer de select box op de juiste waarde te zetten of zet in details
    const select = document.getElementById('klantType');
    // Simpele check of de optie bestaat, anders in bericht zetten
    document.getElementById('klantBericht').value = `Ik heb interesse in pakket: ${titel}. \n\n`;
}

function nieuweAanvraagOpslaan() {
    const nieuweOrder = {
        id: Date.now(),
        naam: document.getElementById('klantNaam').value,
        datum: document.getElementById('klantDatum').value,
        type: document.getElementById('klantType').value,
        bericht: document.getElementById('klantBericht').value
    };

    const orders = JSON.parse(localStorage.getItem('tuinOrders'));
    orders.push(nieuweOrder);
    localStorage.setItem('tuinOrders', JSON.stringify(orders));

    alert('Bedankt! Uw aanvraag is verstuurd. We nemen spoedig contact op.');
    document.getElementById('klantFormulier').reset();
}

// FUNCTIES VOOR ADMIN PAGINA (admin.html)

function laadOrdersInAdmin() {
    const tabel = document.getElementById('orderTabel');
    const orders = JSON.parse(localStorage.getItem('tuinOrders'));
    const teller = document.getElementById('orderCount');
    
    if(teller) teller.innerText = orders.length;

    // Sorteer op datum (planning)
    orders.sort((a, b) => new Date(a.datum) - new Date(b.datum));

    tabel.innerHTML = '';
    orders.forEach((order, index) => {
        const row = `
            <tr>
                <td>${order.datum}</td>
                <td><strong>${order.naam}</strong></td>
                <td>${order.type}</td>
                <td><small>${order.bericht}</small></td>
                <td><button onclick="verwijderOrder(${index})" style="background:red; color:white; border:none; padding:5px; cursor:pointer;">X</button></td>
            </tr>
        `;
        tabel.innerHTML += row;
    });
}

function voegPakketToe() {
    const nieuwPakket = {
        titel: document.getElementById('pakketTitel').value,
        prijs: document.getElementById('pakketPrijs').value,
        beschrijving: document.getElementById('pakketBeschrijving').value
    };

    const pakketten = JSON.parse(localStorage.getItem('tuinPakketten'));
    pakketten.push(nieuwPakket);
    localStorage.setItem('tuinPakketten', JSON.stringify(pakketten));

    alert('Pakket toegevoegd!');
    document.getElementById('adminPakketForm').reset();
}

function verwijderOrder(index) {
    if(confirm('Weet je zeker dat je deze order wilt verwijderen?')) {
        const orders = JSON.parse(localStorage.getItem('tuinOrders'));
        orders.splice(index, 1);
        localStorage.setItem('tuinOrders', JSON.stringify(orders));
        laadOrdersInAdmin();
    }
}