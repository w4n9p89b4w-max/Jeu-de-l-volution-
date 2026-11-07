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
      <ol><li><b>Un jour dure 40 secondes</b> (à vitesse ×1). La barre sous « JOUR » se remplit et un compte à rebours s'affiche en haut.</li>
      <li>Pendant la journée, vous faites <b>un seul choix</b> dans les 4 cases : <b>🏠 Constructions</b>, <b>📜 Lois</b>, <b>⚔️ Guerres</b> ou <b>💡 Découvertes</b> (ou <b>😴 Repos</b>, +4 😊). Chaque choix affiche son <span class="g">bonus</span> en vert et son <span class="b">malus</span> en rouge. Une fois le choix fait, les cases se grisent jusqu'au lendemain.</li>
      <li>Si vous ne choisissez rien, la journée passe quand même.</li>
      <li>À la fin du temps, la nuit tombe : production, consommation, croissance, puis parfois un événement.</li></ol>
      <p><b>⏸️</b> met le jeu en pause, <b>×1 / ×2 / ×4</b> accélère le temps. Le temps s'arrête tout seul quand une fenêtre est ouverte (villageois, règles, événement…). Donner des tâches aux villageois ne compte pas comme le choix du jour.</p>`));

    parts.push(sec('cartes', '🗳️ Les 4 catégories', `
      <table><tr><th>Catégorie</th><th>Bonus</th><th>Malus</th></tr>
      <tr><td>🏠 <b>Constructions</b></td><td>Production chaque jour, logements, défense…</td><td>Le prix à payer. Il augmente de 25 % à chaque exemplaire déjà construit. Certains bâtiments polluent ou consomment du charbon.</td></tr>
      <tr><td>📜 <b>Lois</b></td><td>Un effet permanent</td><td>Parfois un prix en 💰 ou un effet négatif permanent. Une loi ne s'adopte qu'une fois.</td></tr>
      <tr><td>⚔️ <b>Guerres</b></td><td>Soldats, défense, paix ou butin</td><td>Ressources, ou le risque de perdre la bataille</td></tr>
      <tr><td>💡 <b>Découvertes</b></td><td>Un effet permanent et un pas vers l'ère suivante</td><td>Du savoir 💡</td></tr></table>`));

    parts.push(sec('res', '🪵 Les ressources', `
      <table><tr><th></th><th>Ressource</th><th>D'où elle vient</th></tr>
      <tr><td>🍖</td><td>Nourriture</td><td>Base 3/jour, villageois à la <b>chasse</b> 🏹, camp de chasse, champs, moulins, fermes. Chaque habitant en mange (1 pour 3 habitants, 1 pour 4 soldats).</td></tr>
      <tr><td>🪵</td><td>Bois</td><td>Les villageois <b>bûcherons</b> 🌲, puis la scierie et les usines.</td></tr>
      <tr><td>🪨</td><td>Pierre</td><td>Les villageois aux <b>pierres</b> 🪨, puis la carrière, les tailleurs de pierre et la gare.</td></tr>
      <tr><td>🔩</td><td>Fer</td><td>À partir du <b>Moyen Âge</b> : villageois <b>mineurs de fer</b> ⛏️, mine de fer (après <i>Métallurgie du fer</i>), haut-fourneau, recyclage.</td></tr>
      <tr><td>⚫</td><td>Charbon</td><td>À partir de la <b>Renaissance</b> : villageois <b>mineurs de charbon</b> ⚫, mine de charbon, machine à vapeur, éoliennes. Hauts-fourneaux et usines en consomment chaque jour.</td></tr>
      <tr><td>💰</td><td>Or</td><td>Villageois <b>marchands</b> 💰, 1 pour 12 villageois sans tâche, marchés, banques, gares, lois.</td></tr>
      <tr><td>💡</td><td>Savoir</td><td>Base 1/jour, villageois <b>savants</b> 💡, 1 pour 20 villageois sans tâche, feu, temples, bibliothèques, universités…</td></tr></table>
      <h4>🪨 Ouvrir une carrière</h4>
      <p>Quand vous découvrez les <b>Outils en pierre</b>, le jeu vous propose d'ouvrir une carrière (A : l'ouvrir tout de suite pour du bois, B : plus tard). Elle produit +4 🪨/jour en plus des ramasseurs. Si vous dites « plus tard », elle reste disponible dans 🏠 Constructions.</p>
      <p>Carrières et mines s'installent au pied des montagnes.</p>`));

    const J = E.JB;
    parts.push(sec('villageois', '👷 Les villageois et leurs tâches', `
      <p>Chaque habitant est une personne avec un <b>nom</b>, une <b>force</b> et une <b>faiblesse</b>. Touchez <b>👷 Villageois</b> en bas de l'écran (ou une pastille de ressource). Ce n'est pas le choix du jour : vous pouvez tout changer quand vous voulez.</p>
      <h4>Onglet « 📋 Tâches »</h4>
      <p>La liste de toutes les tâches. Sur chaque ligne, <b>+</b> envoie un villageois de plus et <b>−</b> en retire un, selon vos besoins. La ligne montre combien de villageois y travaillent et ce qu'ils rapportent par jour. En haut, <b>« Au village, sans tâche »</b> compte ceux qui sont libres. Le jeu choisit lui-même <b>qui</b> part : d'abord ceux qui <b>préfèrent</b> la tâche, puis <b>les plus forts</b>. <b>✨ Répartir comme le conseille le jeu</b> répartit tout le monde selon les besoins du pays.</p>
      <h4>Onglet « ⭐ Préférences »</h4>
      <p>Un tableau : une ligne par villageois, une colonne par tâche. Touchez une case pour changer : <b>+ Haute</b>, <b>○ Normale</b>, <b>− Basse</b>, <b>✕ Jamais</b> (jamais envoyé à cette tâche). Au départ, la préférence est haute là où le villageois est <em>fort</em> et basse là où il est <em>faible</em> (c'est écrit sous le symbole). La case entourée en bleu est sa tâche actuelle. Touchez un nom pour voir sa fiche : ce qu'il rapporterait dans chaque tâche.</p>
      <table><tr><th>Tâche</th><th>Rapporte (par villageois et par jour)</th><th>Disponible</th></tr>
      ${E.JOBS.map((j) => `<tr><td>${j.icon} <b>${j.name}</b></td><td>${j.id === 'idle' ? '1 💰 pour 12 et 1 💡 pour 20 villageois sans tâche' : `${String(j.base).replace('.', ',')} ${j.res === 'def' ? '🛡️ (plus à chaque ère)' : I[j.res]}`}<br><small>${j.desc}</small></td><td>${j.lock || 'Dès le début'}</td></tr>`).join('')}
      </table>
      <p>Des découvertes augmentent ces rendements : le feu pour la chasse, les outils, la métallurgie et la vapeur pour le bois et la pierre, l'écriture, l'imprimerie et l'informatique pour les savants, la monnaie et la lettre de change pour les marchands…</p>
      <h4>Forces et faiblesses</h4>
      <p>Chaque villageois est <span class="g">doué pour une tâche (×1,6)</span> et <span class="b">mauvais dans une autre (×0,5)</span>. Dans la liste, chaque tâche affiche ce que la personne rapporterait : 💪 marque sa force, 🐌 sa faiblesse.</p>
      <table><tr><th>Tâche</th><th>💪 Force</th><th>🐌 Faiblesse</th></tr>
      ${Object.keys(E.STRONG).map((k) => `<tr><td>${J[k].icon} ${J[k].name}</td><td>${E.STRONG[k]}</td><td>${E.WEAK[k]}</td></tr>`).join('')}
      </table>
      <h4>Expérience</h4>
      <p>Chaque jour passé à la même tâche ajoute +2 % de rendement dans cette tâche, jusqu'à +30 %. L'expérience est gardée si la personne change de tâche puis revient.</p>
      <h4>Nouveaux villageois</h4>
      <p>Quand la population grandit, les nouveaux venus arrivent <b>au village, sans tâche</b> : envoyez-les au travail avec <b>+</b>. La pastille rouge sur 👷 compte les villageois sans tâche.</p>
      <p>Les soldats 🪖 sont à part : ils ne comptent pas parmi les villageois.</p>`));

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
      <h4>Les soldats de chaque époque</h4>
      <p>L'armée est à part : les soldats ne sont pas des villageois. Ils mangent 1 🍖 pour 4 soldats par jour. <b>En temps de paix, ils chassent</b> : chaque soldat rapporte 1 🍖 par jour (1,25 avec la maîtrise du feu). <b>En temps de guerre</b> (pendant 5 jours après une attaque ou une invasion, signalé par 🔥 en haut de l'écran), ils restent au camp et ne chassent plus. Un traité de paix arrête la guerre tout de suite. Chaque soldat <b>garde les armes de l'époque où il a été recruté</b>.</p>
      <table><tr><th>Ère</th><th>Unité</th><th>Armes</th><th>Force</th><th>Recrutement</th></tr>
      ${E.UNITS.map((u) => `<tr><td>${ERA_ICON[u.era]}</td><td>${u.icon} <b>${u.name}</b></td><td>${u.weapon}</td><td>${String(u.power).replace('.', ',')} ⚔️</td><td>+${u.n} pour ${fmtCost(u.cost)}</td></tr>`).join('')}
      </table>
      <p><b>⚒️ Réarmer</b> : quand vous changez d'ère, vos anciens soldats restent faibles. Le choix « Réarmer les anciens soldats » leur donne les armes de l'ère actuelle (environ 60 % du prix d'une recrue, sans nourriture). Dans les batailles perdues, ce sont les soldats les plus mal armés qui tombent en premier.</p>
      <p>Sur la carte, l'armée s'entraîne à côté du village, avec l'équipement de son époque (lances, boucliers, chevaux, canons, fusils, blindés).</p>
      <h4>Votre puissance</h4>
      <p><b>Puissance ⚔️ = force de chaque soldat (selon ses armes) + défense 🛡️.</b> La défense vient des villageois <b>gardes</b>, des remparts, du château, de certaines lois et de la métallurgie. La force de l'ennemi augmente <b>chaque jour</b> et à chaque ère.</p>
      <h4>Les choix de guerre</h4>
      <ul><li><b>Recruter</b> : ajoute des soldats de l'époque actuelle (voir le tableau).</li>
      <li><b>⚒️ Réarmer</b> : donne les armes de l'époque actuelle aux anciens soldats.</li>
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

    const nav = [['but', 'But'], ['jour', 'Journée'], ['cartes', 'Catégories'], ['res', 'Ressources'], ['villageois', 'Villageois'], ['peuple', 'Population'], ['eres', 'Ères'], ['guerre', 'Guerre'], ['events', 'Événements'], ['constructions', 'Constructions'], ['lois', 'Lois']];
    return { nav, html: parts.join('') };
  }

  root.Rules = { build };
})(window);
