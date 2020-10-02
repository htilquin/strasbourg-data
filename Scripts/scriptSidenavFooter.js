const header = document.getElementsByTagName('header')[0];

const groupeMenu = document.createElement('div');
groupeMenu.setAttribute('id', 'groupeMenu');
groupeMenu.appendChild(document.createElement('span'));
groupeMenu.appendChild(document.createElement('span'));
groupeMenu.appendChild(document.createElement('span'));
header.insertBefore(groupeMenu, header.childNodes[0]);

const sidenav = document.createElement('div');
sidenav.setAttribute('class', 'sidenav');
header.insertBefore(sidenav, header.childNodes[0]);

const pSideNav = document.createElement('p');
sidenav.appendChild(pSideNav);

const aHome = document.createElement('a');
aHome.setAttribute('href', 'Accueil.html');
aHome.setAttribute('class', 'sideHome');
aHome.innerHTML = `<img src=\"Images/Icons/cathedraleSIIwhite.png\" 
alt=\"Accueil"/><p>Accueil</p>`;
pSideNav.appendChild(aHome);

dataCat.records.forEach(category => {
    const dCat = document.createElement('div');
    sidenav.appendChild(dCat);

    const pCat = document.createElement('p');
    pCat.setAttribute('class', `dropdown-btn ${category.id}`);
    var source = 'Images/SideNav/side-' + category.id + '.png';
    pCat.innerHTML = `<img src=\"${source}\" alt=\"${category.name}\"/>
    <p>${category.name}</p>`;

    dCat.appendChild(pCat);

    const divDropdown = document.createElement('div');
    divDropdown.setAttribute('class', 'dropdown');
    dCat.appendChild(divDropdown);

    category.fields.forEach(souscat => {
        const aSousCat = document.createElement('a');
        aSousCat.textContent = souscat.nom;
        aSousCat.setAttribute('href', souscat.url);
        divDropdown.appendChild(aSousCat);
    });
});

/* Loop through all dropdown buttons to toggle between 
hiding and showing its dropdown content */
const dropdown = document.getElementsByClassName("dropdown-btn");
for (let i = 0; i < dropdown.length; i++) {
    dropdown[i].addEventListener("click", function () {
        this.classList.toggle("active");
        const panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
            panel.style.maxHeight = null;
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px";
        }

        for (let j = 0; j < dropdown.length; j++) {
            const panelj = dropdown[j].nextElementSibling;
            if (j != i && panelj.style.maxHeight) {
                panelj.style.maxHeight = null;
                dropdown[j].classList.toggle("active");
            }
        }
    });
}

const menu = document.getElementById("groupeMenu");
menu.addEventListener("click", function () {
    this.classList.toggle("change");
    if (sidenav.style.width) {
        sidenav.style.width = null;
    } else {
        sidenav.style.width = 200 + "px";
    }
});

//Footer
const main = document.getElementsByTagName('main')[0];
const footer = document.createElement('footer');
main.appendChild(footer);

const pCredit = document.createElement('p');
pCredit.textContent = "Données Eurométropole de Strasbourg - ";
footer.appendChild(pCredit);

const aRef = document.createElement('a');
aRef.setAttribute('href', 'https://data.strasbourg.eu/');
aRef.textContent = "Open Data Strasbourg.eu";
pCredit.appendChild(aRef);