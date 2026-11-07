/* ==========================================================================
   L'Évolution — l'annexe « Règles du jeu »
   Les listes (ères, constructions, lois, découvertes, cartes…) sont
   générées à partir des données du moteur : elles restent toujours justes.
   ========================================================================== */
(function (root) {
  'use strict';

  function build(E) {
    const I = E.RES_ICONS;
    const fmtCost = (c) => Object.keys(c).filter((r) => c[r]).map((r) => `${c[r]} ${I[r]}`).join(' ') || 'gratuit';
    const fmtEff = (e) => Object.keys(e).filter((r) => e[r]).map((r) => {
      const v = e[r], perDay = !['cap', 'def', 'happy'].includes(r);
      return `<span class="${v > 0 ? 'g' : 'b'}">${v > 0 ? '+' : '−'}${Math.abs(v)} ${I[r]}${perDay ? '/j' : ''}</span>`;
    }).join(' ') || '—';
    const ERA_ICON = ['🛖', '🏛️', '🏰', '🎨', '🏭', '🏙️'];

    const sec = (id, title, html) => `<section id="r-${id}"><h3>${title}</h3>${html}</section>`;
    const parts = [];

    parts.push(sec('but', '🎯 Le but', `
      <p>Vous fondez un pays dans une vallée entourée de montagnes, avec <b>5 habitants</b>. Faites-le évoluer de la <b>Préhistoire</b> au <b>Monde moderne</b>, puis découvrez la <b>Conquête spatiale</b> et construisez la <b>🚀 Base spatiale</b> : c'est la victoire.</p>
      <p>Vous perdez si la population tombe à <b>0</b>. La sauvegarde est alors effacée et il faut fonder un nouveau pays.</p>`));

    parts.push(sec('debut', '🚩 Le début de partie', `
      <ol><li>Choisissez un <b>nom</b> et dessinez un <b>drapeau</b>.</li>
      <li>Premier choix : où fonder le pays ?
        <ul><li><b>A · Au bord de la rivière</b> : +25 % de nourriture produite.</li>
        <li><b>B · Au bord du lac</b> : +3 🍖 et +2 💰 par jour.</li></ul></li></ol>`));

    parts.push(sec('jour', '📅 Une journée', `
      <ol><li>En bas de l'écran, 4 cases : <b>🏠 Constructions</b>, <b>📜 Lois</b>, <b>⚔️ Guerres</b> et <b>💡 Découvertes</b>. La pastille rouge indique combien de choix sont possibles.</li>
      <li>Ouvrez une case et touchez un choix. Chaque choix affiche son <span class="g">bonus</span> en vert et son <span class="b">malus</span> en rouge. Vous ne faites <b>qu'un choix par jour</b>.</li>
      <li>Rien ne vous plaît ? <b>😴 Repos</b> passe la journée (+4 😊).</li>
      <li>La nuit tombe : production, consommation, croissance, puis parfois un événement.</li></ol>
      <p>Un choix grisé indique ce qui manque (« Manque : fer »…).</p>`));

    parts.push(sec('cartes', '🗳️ Les 4 catégories', `
      <table><tr><th>Catégorie</th><th>Bonus</th><th>Malus</th></tr>
      <tr><td>🏠 <b>Constructions</b></td><td>Production chaque jour, logements, défense…</td><td>Le prix à payer. Il augmente de 25 % à chaque exemplaire déjà construit. Certains bâtiments polluent ou consomment du charbon.</td></tr>
      <tr><td>📜 <b>Lois</b></td><td>Un effet permanent</td><td>Parfois un prix en 💰 ou un effet négatif permanent. Une loi ne s'adopte qu'une fois.</td></tr>
      <tr><td>⚔️ <b>Guerres</b></td><td>Soldats, défense, paix ou butin</td><td>Ressources, ou le risque de perdre la bataille</td></tr>
      <tr><td>💡 <b>Découvertes</b></td><td>Un effet permanent et un pas vers l'ère suivante</td><td>Du savoir 💡</td></tr></table>`));

    parts.push(sec('res', '🪵 Les ressources', `
      <table><tr><th></th><th>Ressource</th><th>D'où elle vient</th></tr>
      <tr><td>🍖</td><td>Nourriture</td><td>Base 3/jour, chasse, champs, moulins, fermes. Chaque habitant en mange (1 pour 3 habitants, 1 pour 4 soldats).</td></tr>
      <tr><td>🪵</td><td>Bois</td><td>Les <b>habitants envoyés en forêt</b> (bouton 🌲 en bas) : 1,5 🪵 chacun par jour, +0,5 avec les <i>Outils en pierre</i>, +0,5 avec la <i>Métallurgie du fer</i>, +1 avec la <i>Machine à vapeur</i>. Puis la scierie et les usines.</td></tr>
      <tr><td>🪨</td><td>Pierre</td><td>Les <b>habitants qui ramassent des pierres</b> (bouton 🌲🪨) : 0,75 🪨 chacun par jour, +0,25 avec les <i>Outils en pierre</i>, +0,25 avec la <i>Métallurgie du fer</i>, +0,5 avec la <i>Machine à vapeur</i>. Puis la carrière, les tailleurs de pierre et la gare.</td></tr>
      <tr><td>🔩</td><td>Fer</td><td>À partir du <b>Moyen Âge</b> : mine de fer (après <i>Métallurgie du fer</i>), haut-fourneau, recyclage.</td></tr>
      <tr><td>⚫</td><td>Charbon</td><td>À partir de la <b>Renaissance</b> : mine de charbon, machine à vapeur, éoliennes. Hauts-fourneaux et usines en consomment chaque jour.</td></tr>
      <tr><td>💰</td><td>Or</td><td>1 pour 12 habitants restés au village (ni en forêt, ni aux pierres), marchés, banques, gares, lois.</td></tr>
      <tr><td>💡</td><td>Savoir</td><td>Base 1/jour + 1 pour 20 habitants restés au village, feu, temples, bibliothèques, universités…</td></tr></table>
      <h4>👷 Le travail des habitants</h4>
      <p>Au début, pas de bâtiment pour le bois ni la pierre : touchez <b>🌲 🪨</b> en bas de l'écran (ou les pastilles 🪵 et 🪨) et choisissez combien d'habitants partent <b>couper du bois</b> et combien partent <b>ramasser des pierres</b> au pied de la montagne. Ce n'est pas le choix du jour : vous pouvez le changer à tout moment. Sur la carte, les bûcherons ont une hache sur l'épaule et les ramasseurs portent une pierre.</p>
      <p><span class="g">Bonus</span> : du bois et de la pierre chaque jour. <span class="b">Malus</span> : les travailleurs ne rapportent plus d'or ni de savoir.</p>
      <h4>🪨 Ouvrir une carrière</h4>
      <p>Quand vous découvrez les <b>Outils en pierre</b>, le jeu vous propose d'ouvrir une carrière (A : l'ouvrir tout de suite pour du bois, B : plus tard). Elle produit +4 🪨/jour en plus des ramasseurs. Si vous dites « plus tard », elle reste disponible dans 🏠 Constructions.</p>
      <p>Carrières et mines s'installent au pied des montagnes.</p>`));

    parts.push(sec('peuple', '👤 Population et bonheur', `
      <ul><li><b>Croissance</b> : chaque nuit, la population grandit d'environ 7 % (au moins 1 habitant) s'il reste de la nourriture, s'il y a de la place 🏠 et si le bonheur est d'au moins 25 %.</li>
      <li><b>Logements</b> 🏠 : 5 places au départ, puis huttes, maisons, immeubles, gratte-ciel… Quand c'est plein, plus personne n'arrive et le bonheur baisse.</li>
      <li><b>Famine</b> 🍂 : si la nourriture tombe sous 0, 10 % des habitants (+1) partent et le bonheur chute.</li>
      <li><b>Bonheur</b> 😊 : il rejoint petit à petit 50 % + les bonus et malus de vos bâtiments et lois. Il change toute la production : de <b>×0,75</b> (0 %) à <b>×1,25</b> (100 %).</li>
      <li><b>Manif</b> 📢 : sous 30 % de bonheur, le peuple descend souvent dans la rue (−30 % 💰 et −20 % 🪵).</li></ul>`));

    parts.push(sec('eres', '⏳ Les ères et les découvertes', `
      <p>Chaque ère a <b>3 découvertes</b>. Quand les 3 sont faites, on passe à l'ère suivante et de nouveaux bâtiments, lois et découvertes apparaissent. La case 💡 Découvertes indique combien il en reste avant l'ère suivante.</p>
      <table><tr><th>Ère</th><th>Découvertes (coût en 💡)</th></tr>
      ${E.ERAS.map((er, i) => `<tr><td>${ERA_ICON[i]} <b>${er.name}</b><br><small>${er.year}</small></td><td>${E.DISCOVERIES.filter((d) => d.era === i).map((d) => `${d.icon} ${d.name} <small>(${d.cost} 💡)</small> ${fmtEff(d.eff)}<br><small>${d.desc}</small>`).join('<br>')}</td></tr>`).join('')}
      </table>`));

    parts.push(sec('guerre', '⚔️ La guerre', `
      <h4>À qui déclarer la guerre ?</h4>
      <p>Il y a un voisin par ère. Le choix <b>Attaquer</b> vise toujours le voisin de votre ère actuelle :</p>
      <table>${E.ERAS.map((er, i) => `<tr><td>${ERA_ICON[i]} ${er.name}</td><td>${er.enemy}</td></tr>`).join('')}</table>
      <h4>Votre puissance</h4>
      <p><b>Puissance ⚔️ = soldats × (1 + 0,5 par ère) + défense 🛡️.</b> La défense vient des remparts, du château, de certaines lois et de la métallurgie. La force de l'ennemi augmente <b>chaque jour</b> et à chaque ère.</p>
      <h4>Les choix de guerre</h4>
      <ul><li><b>🪖 Recruter</b> : ajoute des soldats. Ça coûte de la nourriture, puis de l'or, puis du fer à partir du Moyen Âge.</li>
      <li><b>🧱 Fortifier</b> : ajoute de la défense pour toujours (palissade en bois, puis remparts de pierre, puis défenses en acier).</li>
      <li><b>🕊️ Traité de paix</b> : aucune invasion pendant 12 jours, et +3 😊.</li>
      <li><b>⚔️ Attaquer</b> : affiche vos chances de gagner. Il faut au moins un soldat.</li></ul>
      <h4>Victoire ou défaite</h4>
      <table><tr><th>Si vous gagnez 🏆</th><th>Si vous perdez 💀</th></tr>
      <tr><td>Butin en 🍖 🪵 🪨, plus 💰 et 🔩 dans les ères avancées. <b>2 + ère</b> habitants rejoignent votre pays. +4 😊. Vous perdez 10 % de vos soldats.</td>
      <td>Vous perdez <b>40 % des soldats</b>, <b>1 + ère</b> habitants et 8 😊.</td></tr></table>
      <h4>Peut-on retenter après une défaite ?</h4>
      <p><b>Oui.</b> Une défaite ne termine pas la partie. Vous pouvez réattaquer dès le lendemain (un choix par jour), tant qu'il vous reste des soldats. Comme l'ennemi devient plus fort chaque jour, recrutez ou fortifiez d'abord, et visez au moins 60-70 % de chances.</p>
      <h4>Les invasions</h4>
      <p>À partir du jour 11, chaque nuit, il y a environ <b>7 % de risque</b> (+1 % par ère) qu'un voisin vous attaque, sauf pendant une paix. Si votre puissance est au moins égale à la sienne, l'invasion est repoussée (+5 😊). Sinon, c'est le pillage : 12 % des habitants, 30 % des réserves et la moitié de l'armée sont perdus.</p>`));

    parts.push(sec('events', '🎲 Événements et dilemmes', `
      <p>Certaines nuits, il se passe quelque chose : récolte abondante, nomades, comète, trésor, filon de fer, tempête, loups, crue, épidémie (impossible après les <i>Vaccins</i>), incendie, coup de grisou…</p>
      <p>Plus rarement, un <b>dilemme</b> vous oblige à choisir entre <b>A</b> et <b>B</b> :</p>
      <ul>${E.DILEMMAS.map((d) => `<li>${d.icon} <b>${d.title}</b> : ${d.choices.map((c, i) => `${'AB'[i]} · ${typeof c.label === 'function' ? c.label({}) : c.label}`).join(' / ')}</li>`).join('')}</ul>`));

    parts.push(sec('constructions', '🏠 Toutes les constructions', E.ERAS.map((er, i) => `
      <h4>${ERA_ICON[i]} ${er.name}</h4>
      <table><tr><th>Bâtiment</th><th>Prix</th><th>Effet</th></tr>
      ${E.BUILDINGS.filter((b) => b.era === i).map((b) => `<tr><td>${b.icon} ${b.name}${b.req ? `<br><small>après ${E.D[b.req].name}</small>` : ''}</td><td>${fmtCost(b.cost)}</td><td>${b.id === 'fusee' ? '<b>🏆 VICTOIRE</b>' : fmtEff(b.eff)}</td></tr>`).join('')}
      </table>`).join('')));

    parts.push(sec('lois', '📜 Toutes les lois', `
      <p>Une loi s'adopte une seule fois et s'applique pour toujours.</p>
      <table><tr><th>Loi</th><th>Prix</th><th>Effet</th></tr>
      ${E.LAWS.map((l) => `<tr><td>${l.icon} ${l.name}<br><small>${E.ERAS[l.era].name}</small></td><td>${fmtCost(l.cost)}</td><td>${fmtEff(l.eff)}</td></tr>`).join('')}
      </table>`));

    parts.push(sec('controles', '👆 Commandes', `
      <ul><li>Glissez sur la carte pour vous déplacer. Pincez, ou utilisez la molette, pour zoomer. 🎯 recentre la vue.</li>
      <li>📖 <b>Journal</b> : l'histoire de votre pays jour après jour (vous pouvez aussi toucher le nom du pays).</li>
      <li>⚙️ : recommencer une partie. La partie est sauvegardée automatiquement chaque nuit, dans ce navigateur.</li></ul>`));

    const nav = [['but', 'But'], ['jour', 'Journée'], ['cartes', 'Catégories'], ['res', 'Ressources'], ['peuple', 'Population'], ['eres', 'Ères'], ['guerre', 'Guerre'], ['events', 'Événements'], ['constructions', 'Constructions'], ['lois', 'Lois']];
    return { nav, html: parts.join('') };
  }

  root.Rules = { build };
})(window);
