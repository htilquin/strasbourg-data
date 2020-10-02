const pageName = 'Accueil';
ajaxGetState(pageName);

dataCat.records.forEach(category => {
    const card = document.createElement('div');
    card.setAttribute('class', 'cardCat');

    const divImgTitle = document.createElement('div');
    divImgTitle.setAttribute('class', `categoryBloc ${category.id}`);

    imgCat(divImgTitle, category);

    const hNomCat = document.createElement('h1');
    hNomCat.setAttribute('class', 'catName');
    hNomCat.textContent = category.name;

    const divDropdown = document.createElement('div');
    divDropdown.setAttribute('class', 'panel');

    container.appendChild(card);
    card.appendChild(divImgTitle);
    divImgTitle.appendChild(hNomCat);
    divImgTitle.appendChild(divDropdown);

    category.fields.forEach(souscat => {
        const lienSousCat = document.createElement('a');
        lienSousCat.textContent = souscat.nom;
        lienSousCat.setAttribute('href', souscat.url);

        if (souscat.realtime == 1) {
            const realTimeIcon = document.createElement('img');
            realTimeIcon.src = 'Images/Icons/realTime.png';
            realTimeIcon.setAttribute('class', 'realTime');
            realTimeIcon.setAttribute('alt', "RealTime");
            lienSousCat.setAttribute('class', 'realTime');
            lienSousCat.appendChild(realTimeIcon);
        }
        divDropdown.appendChild(lienSousCat);
    });
});

openClose();
/**
 * Opens or closes the dropdown of .categoryBloc elements on click.
 * Closes the other .categoryBloc element dropdown if one is already open.
 * Closes the dropdown if click elsewhere in the page.
 */
function openClose() {
    const acc = document.getElementsByClassName('categoryBloc');
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function () {
            acc[i].classList.toggle("active");
            const panel = this.lastElementChild;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            }
            else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }

            for (let j = 0; j < acc.length; j++) {
                const panelj = acc[j].lastElementChild;
                if (j != i && panelj.style.maxHeight) {
                    panelj.style.maxHeight = null;
                    acc[j].classList.toggle("active");
                }
            }
        });

        window.onclick = function (event) {
            if (!(event.target.matches('.catLogo') ||
                event.target.matches('.catName') ||
                event.target.matches('.categoryBloc'))) {
                for (let j = 0; j < acc.length; j++) {
                    var panelj = acc[j].lastElementChild;
                    if (panelj.style.maxHeight) {
                        panelj.style.maxHeight = null;
                        acc[j].classList.toggle("active");
                    }
                }
            }
        };
    }
}

/**
 * 
 * @param {Element} card - element that will get the logo
 * @param {object} category - category of the card
 * @param {string} category.id
 * @param {string} category.name
 */
function imgCat(card, category) {
    const logo = document.createElement('img');
    logo.src = 'Images/logo-' + category.id + '.png';
    logo.setAttribute('class', 'catLogo');
    logo.setAttribute('alt', category.name);
    card.appendChild(logo);
}