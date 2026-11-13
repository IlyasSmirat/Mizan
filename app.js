// const apiKey = "ga_live_vW0GfdNw2QjoMW65Ib0-VITYBnjR8S07m5f2fBPS";
const cards = document.getElementById("cards");
const metalTemplate = document.getElementById("metalTemplate");
const selectDevise = document.getElementById("devise");


async function getApi(devise){
    const apiUrl = `https://xaus.com/api/v1/spot?currency=${devise}`;
    const response = await fetch(apiUrl);
    if(!response.ok){
        throw new Error ("API request failed");
    }
    let data;
    try{
        data = await response.json();
    }
    catch(error){
        throw new Error("Unable to load metal prices. Please try again later.");
    }
    
    return data;
}

function calculerVariation(points){
    
    if(points.length < 2) {
        return null;
    }

    const dernierPoint = points[points.length - 1];
    const apresDernier = points[points.length - 2];
    const prixActuelle = dernierPoint.c;
    const prixPrecedent = apresDernier.c;
        
    const variation = prixActuelle - prixPrecedent;
    const pourcentage = (variation / prixPrecedent) * 100;
    let sens;

    if(variation > 0){
        sens = "hausse";
    }
    else if(variation < 0){
        sens = "baisse";
    }
    else{
        sens = "stable";
    }
    return {
        variation: variation,
        pourcentage: pourcentage,
        sens: sens
    };
}


async function getPoints(symbole, range){
    const url = `https://xaus.com/api/v1/chart?symbol=${symbole}&range=${range}&interval=1d`

    const response = await fetch(url);
    
    if(!response.ok){
        throw new Error("Chart request failed !");
    }
        const data = await response.json();
        
        return data;
}

function afficherVariation(carte, result, fx_rate){
    if(result === null){
        carte.querySelector(".metal-variation").textContent = "Données insuffisantes";
        carte.querySelector(".metal-percentage").textContent = "";
        return;
    }

    const variationConvertie = result.variation * fx_rate;
    carte.querySelector(".metal-variation").textContent = result.sens === "hausse" ? "↑ " + variationConvertie.toFixed(2) : result.sens === "baisse" ? "↓ " + variationConvertie.toFixed(2) : "→ " + variationConvertie.toFixed(2);
    carte.querySelector(".metal-percentage").textContent = result.pourcentage.toFixed(2) + "%";

    if(result.sens === "hausse"){
            carte.querySelector(".metal-variation").style.color = "green";
            carte.querySelector(".metal-percentage").style.color = "green"
        }
        else if(result.sens === "baisse"){
            carte.querySelector(".metal-variation").style.color = "red";
            carte.querySelector(".metal-percentage").style.color = "red";
        }
        else{
            carte.querySelector(".metal-variation").style.color = "gray";
            carte.querySelector(".metal-percentage").style.color = "gray";
        }
}

const variations = {};
try {
    const data = await getApi(selectDevise.value);
    const metaux = [
        {
            symbole: "xau",
            nom: "or",
            prix: data.xau.price,
            devise: data.xau.currency
        },
        {
            symbole: "silver",
            nom: "argent",
            prix: data.silver_usd_oz * data.fx_rate,
            devise: data.xau.currency
        }
    ];
    for (const metal of metaux) {
        const clone = metalTemplate.content.cloneNode(true);
        const carte = clone.querySelector(".metal-card");
        carte.id = metal.symbole;
        carte.querySelector(".metal-name").textContent = metal.nom;
        carte.querySelector(".metal-price").textContent = "Prix : " + metal.prix + " " + metal.devise;
        carte.querySelector(".metal-update").textContent = "Mise à jour le : " + data.updated_at.split("T")[0] + " " + data.updated_at.split("T")[1].split(".")[0];
        cards.appendChild(clone);
        const historique = await getPoints(metal.symbole, "1mo");
        const resultat = calculerVariation(historique.points);
        afficherVariation(carte, resultat, data.fx_rate)
    }
} catch (error) {
    alert(error.message);
}

selectDevise.addEventListener("change", async function(){
    try {
        const data = await getApi(selectDevise.value);
        const carteOr = document.getElementById("xau");
        const carteArgent = document.getElementById("silver");

        carteOr.querySelector(".metal-price").textContent =
        "Prix : " + data.xau.price + " " + data.xau.currency;

        carteArgent.querySelector(".metal-price").textContent =
        "Prix : " + data.silver_usd_oz * data.fx_rate + " " + data.xau.currency;
    } catch(error) {
        alert(error.message);
    }
});