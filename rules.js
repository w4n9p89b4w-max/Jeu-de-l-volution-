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
      <li>Pendant la journée, vous faites <b>un seul choix</b> dans les 4 cases : <b>🏠 Constructions</b>, <b>📜 Lois</b>, <b>⚔️ Guerres</b> (ou <b>😴 Repos</b>, +4 😊). La 4e case, <b>🔬 Recherche</b>, ne compte pas : vous pouvez y choisir vos recherches à tout moment. Chaque choix affiche son <span class="g">bonus</span> en vert et son <span class="b">malus</span> en rouge. Une fois le choix fait, les cases se grisent jusqu'au lendemain.</li>
      <li>Si vous ne choisissez rien, la journée passe quand même.</li>
      <li>À la fin du temps, la nuit tombe : production, consommation, croissance, puis parfois un événement.</li></ol>
      <p><b>⏸️</b> met le jeu en pause, <b>×1 / ×2 / ×4</b> accélère le temps. Le temps s'arrête tout seul quand une fenêtre est ouverte (villageois, règles, événement…). Donner des tâches aux villageois ne compte pas comme le choix du jour.</p>`));

    parts.push(sec('principal', '🛖 La Maison commune', `
      <p><b>C'est la première chose à construire</b> (8 🪵, dans 🏠 Constructions) : sans elle, <b>personne ne peut recevoir de tâche</b>, tout le monde reste au village. Elle organise le travail : son niveau fixe <b>combien de villageois peuvent travailler en même temps</b>.</p>
      <p>À chaque nouvelle ère, vous pouvez l'<b>agrandir</b> (choix du jour, dans 🏠 Constructions) : elle change de nom et d'aspect sur la carte, accueille plus de travailleurs et donne +6 🏠, +3 🛡️ et +2 😊 par niveau.</p>
      <table><tr><th>Ère</th><th>Maison commune</th><th>Travailleurs</th><th>Prix pour l'agrandir</th></tr>
      ${E.MAIN.map((m, i) => `<tr><td>${ERA_ICON[i]}</td><td>${m.icon} <b>${m.name}</b></td><td>${m.workers > 9999 ? 'illimité' : m.workers}</td><td>${i ? fmtCost(m.cost) : '8 🪵 (construction)'}</td></tr>`).join('')}
      </table>
      <p>Quand elle est pleine, les villageois en trop restent au village (ils rapportent un peu d'or et de savoir).</p>`));

    parts.push(sec('recherche', '🔬 La recherche', `
      <p>Tout ce qui est nouveau se <b>recherche</b> : les découvertes de chaque ère, les constructions (sauf la hutte, le cercle du feu, le menhir et le centre de recherche, disponibles dès le début), les améliorations du travail et les armes.</p>
      <p><b>D'abord, construisez le 🔬 Centre de recherche</b> (10 🪵 et 4 🪨, dans 🏠 Constructions ou directement depuis l'écran Recherche). Sans lui, aucune recherche n'avance et personne ne peut être savant ; le savoir s'accumule en attendant. Plus tard, il devient un observatoire.</p>
      <ol><li>Touchez <b>🔬 Recherche</b> et choisissez une ou plusieurs recherches : elles se mettent dans votre <b>file</b> (6 au maximum). Touchez une recherche de la file pour la retirer.</li>
      <li>Chaque nuit, le <b>savoir 💡</b> en stock nourrit la première recherche de la file, puis la suivante s'il en reste. La petite barre sous la case 🔬 montre la progression. Un « ! » apparaît si la file est vide.</li>
      <li>Une recherche terminée : une découverte s'applique tout de suite ; une construction, une amélioration ou une arme vous est <b>proposée</b> (A : la construire, B : plus tard ; elle reste alors dans 🏠 Constructions ou ⚔️ Guerres).</li></ol>
      <p>Certaines recherches en demandent d'autres avant (par exemple le moulin après le champ). Elles affichent « Après : … ».</p>
      <p>Choisir une recherche <b>ne compte pas</b> comme le choix du jour. Pour produire plus de savoir : des villageois <b>savants</b>, le feu, les temples, les bibliothèques…</p>`));

    parts.push(sec('cartes', '🗳️ Les 4 catégories', `
      <table><tr><th>Catégorie</th><th>Bonus</th><th>Malus</th></tr>
      <tr><td>🏠 <b>Constructions</b></td><td>Production chaque jour, logements, défense…</td><td>Le prix à payer. Il augmente de 25 % à chaque exemplaire déjà construit. Certains bâtiments polluent ou consomment du charbon.</td></tr>
      <tr><td>📜 <b>Lois</b></td><td>Un effet permanent</td><td>Parfois un prix en 💰 ou un effet négatif permanent. Une loi ne s'adopte qu'une fois.</td></tr>
      <tr><td>⚔️ <b>Guerres</b></td><td>Soldats, défense, paix ou butin</td><td>Ressources, ou le risque de perdre la bataille</td></tr>
      <tr><td>🔬 <b>Recherche</b></td><td>Débloque les découvertes, les constructions, les améliorations et les armes</td><td>Du savoir 💡, chaque nuit (ne compte pas comme le choix du jour)</td></tr></table>`));

    parts.push(sec('res', '🪵 Les ressources', `
      <table><tr><th></th><th>Ressource</th><th>D'où elle vient</th></tr>
      <tr><td>🍖</td><td>Nourriture</td><td>Base 3/jour, villageois à la <b>chasse</b> 🏹 (voir plus bas), champs, moulins, fermes. Chaque habitant en mange (1 pour 3 habitants, 1 pour 4 soldats).</td></tr>
      <tr><td>🪵</td><td>Bois</td><td>Les villageois <b>bûcherons</b> 🌲, puis la scierie et les usines.</td></tr>
      <tr><td>🪨</td><td>Pierre</td><td>Les villageois aux <b>pierres</b> 🪨, puis la carrière, les tailleurs de pierre et la gare.</td></tr>
      <tr><td>🔩</td><td>Fer</td><td>À partir du <b>Moyen Âge</b> : villageois <b>mineurs de fer</b> ⛏️, mine de fer (après <i>Métallurgie du fer</i>), haut-fourneau, recyclage.</td></tr>
      <tr><td>⚫</td><td>Charbon</td><td>À partir de la <b>Renaissance</b> : villageois <b>mineurs de charbon</b> ⚫, mine de charbon, machine à vapeur, éoliennes. Hauts-fourneaux et usines en consomment chaque jour.</td></tr>
      <tr><td>💰</td><td>Or</td><td>Villageois <b>marchands</b> 💰, 1 pour 12 villageois sans tâche, marchés, banques, gares, lois.</td></tr>
      <tr><td>💡</td><td>Savoir</td><td>Base 1/jour, villageois <b>savants</b> 💡, 1 pour 20 villageois sans tâche, feu, temples, bibliothèques, universités…</td></tr></table>
      <h4>🌳 Ce qui se recherche, domaine par domaine</h4>
      <ul><li><b>Chasse</b> : au début, des villageois chassent en forêt. Puis 🔬 appâts et pièges (+50 % pour les chasseurs), puis camp de chasse.</li>
      <li><b>Agriculture</b> : avec la découverte de l'Agriculture apparaît le métier <b>🌾 Agriculteur</b> (2,5 🍖 par jour). Puis 🔬 champ de blé → charrue (+50 %) → moulin → irrigation (+50 %) → grande ferme → ferme mécanisée → ferme verticale.</li>
      <li><b>Maisons</b> : hutte (dès le début) → 🔬 maison en pierre → colombages → hôtel particulier → immeuble → gratte-ciel.</li>
      <li><b>Pierre</b> : 🔬 carrière (après les outils en pierre), leviers et cordes (+50 %), atelier de tailleurs.</li>
      <li><b>Bois</b> : 🔬 haches en silex (+50 %), puis scierie.</li></ul>
      <h4>📈 La pratique rend la recherche 2 fois moins chère</h4>
      <p>À force de pratiquer, vos villageois prennent de l'expérience : la recherche correspondante coûte alors <b>−50 %</b> (c'est indiqué dans 🔬 Recherche). Un message vous prévient la nuit.</p>
      <table><tr><th>Recherche</th><th>−50 % quand…</th><th>Effet</th><th>Prix pour construire</th></tr>
      ${E.STEPS.filter((st) => !/^w\d/.test(st.key)).map((st) => { const b = E.B[st.b]; return `<tr><td>${b.icon} <b>${b.name}</b></td><td>${st.hint}</td><td>${b.upgrade ? '+50 %' : st.b === 'appats' ? '+50 % chasseurs' : fmtEff(b.eff)}</td><td>${fmtCost(b.cost)}</td></tr>`; }).join('')}
      </table>
      <p>Carrières et mines s'installent au pied des montagnes.</p>`));

    const J = E.JB;
    parts.push(sec('villageois', '👷 Les villageois et leurs tâches', `
      <p>Chaque habitant est une personne avec un <b>nom</b>, une <b>force</b> et une <b>faiblesse</b>. Touchez <b>👷 Villageois</b> en bas de l'écran. Ce n'est pas le choix du jour : vous pouvez tout changer quand vous voulez.</p>
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
      <p>Chaque ère a <b>3 découvertes</b>, à rechercher dans 🔬 Recherche. Quand les 3 sont faites, on passe à l'ère suivante et de nouvelles recherches, lois et unités apparaissent. La case 💡 Découvertes indique combien il en reste avant l'ère suivante.</p>
      <table><tr><th>Ère</th><th>Découvertes (coût en 💡)</th></tr>
      ${E.ERAS.map((er, i) => `<tr><td>${ERA_ICON[i]} <b>${er.name}</b><br><small>${er.year}</small></td><td>${E.DISCOVERIES.filter((d) => d.era === i).map((d) => `${d.icon} ${d.name} <small>(${d.cost} 💡)</small> ${fmtEff(d.eff)}<br><small>${d.desc}</small>`).join('<br>')}</td></tr>`).join('')}
      </table>`));

    parts.push(sec('guerre', '⚔️ La guerre', `
      <h4>Un ennemi par ère</h4>
      <p>À chaque ère, un ennemi menace la vallée. Son nom, sa <b>vie ❤️</b>, sa <b>force ⚔️</b> et le nombre de jours avant sa prochaine attaque sont affichés en haut de l'écran (touchez la pastille pour ouvrir les choix de guerre).</p>
      <table>${E.ERAS.map((er, i) => `<tr><td>${ERA_ICON[i]} ${er.name}</td><td>${er.enemy}</td></tr>`).join('')}</table>
      <h4>Ses attaques</h4>
      <ul><li>Il envoie une armée <b>tous les ${E.RAID_EVERY} jours</b> (la première au jour 11 en Préhistoire, puis 5 jours après chaque changement d'ère).</li>
      <li>Sa force augmente de 2 % chaque jour. L'armée qu'il envoie vaut entre 50 % et 90 % de sa force.</li>
      <li>Si votre puissance (soldats + défense) est au moins égale : <b>attaque repoussée</b>, +5 😊, et l'ennemi perd 10 % de vie.</li>
      <li>Sinon, <b>pillage</b> : 15 % des habitants, 40 % de toutes les réserves, la moitié de l'armée, −15 😊, et <b>un bâtiment incendié</b>.</li>
      <li>Une <b>🕊️ trêve</b> (choix du jour) ou une alliance (dilemme) repousse la prochaine attaque, mais ne met pas fin à la guerre.</li></ul>
      <h4>La seule façon d'y mettre fin : le vaincre</h4>
      <ol><li>Recrutez des soldats (choix du jour), réarmez-les, et choisissez <b>⚔️ Attaquer</b>.</li>
      <li>Chaque attaque lui enlève de la vie selon la <b>puissance de votre armée</b> comparée à sa force : à force égale, environ 55 % ; avec deux fois plus de puissance, il est vaincu d'un coup. Avant d'attaquer, le choix affiche les dégâts prévus et le nombre d'attaques nécessaires.</li>
      <li>Chaque attaque coûte des soldats (moins si vous êtes bien plus fort que lui), les plus mal armés en premier.</li>
      <li>Quand sa vie tombe à 0 : <b>🏆 victoire totale</b>. Gros butin, nouveaux habitants, +10 😊, et <b>plus aucune attaque jusqu'à la fin de l'ère</b>. Un nouvel ennemi apparaît à l'ère suivante.</li></ol>
      <p>Après une défaite partielle, vous pouvez réattaquer dès le lendemain tant qu'il vous reste des soldats. Mais attention : sa force augmente chaque jour, et sa vie ne remonte pas.</p>
      <h4>🗡️ Les armes, étape par étape</h4>
      <p>À chaque ère, les armes des soldats progressent en <b>3 étapes</b> à rechercher dans 🔬 Recherche, l'une après l'autre. Chacune donne <b>+25 % de force</b> aux soldats de cette époque (jusqu'à +75 %). Une fois recherchée, le jeu propose de l'adopter ; sinon elle reste dans ⚔️ Guerres.</p>
      <p>La pratique aide : la 1re étape coûte moitié prix après assez d'<b>entraînement</b> (soldats × jours passés dans l'ère), la 2e après <b>une bataille</b> pendant l'ère, la 3e (un <b>atelier d'armes</b>) après beaucoup d'entraînement.</p>
      <table><tr><th>Ère</th><th>1. Entraînement</th><th>2. Bataille</th><th>3. Atelier</th></tr>
      ${E.ERAS.map((er, i) => `<tr><td>${ERA_ICON[i]}</td>${E.WPN(i).map((id) => `<td>${E.B[id].icon} ${E.B[id].name}<br><small>${fmtCost(E.B[id].cost)}</small></td>`).join('')}</tr>`).join('')}
      </table>
      <p>Les soldats d'une ancienne époque gardent les améliorations de leur époque ; « Réarmer » leur donne celles de l'époque actuelle.</p>
      <h4>Votre puissance</h4>
      <p><b>Pour vous défendre</b> : force de vos soldats + défense 🛡️ (gardes, remparts, château, lois, métallurgie). <b>Pour attaquer</b>, ce sont surtout les soldats qui comptent : la défense ne compte qu'au quart, car les remparts et les gardes restent au pays.</p>
      <h4>Temps de guerre</h4>
      <p>Après chaque bataille (attaque ou défense), le pays est <b>en guerre 5 jours</b> (🔥 en haut de l'écran) : les soldats ne chassent plus.</p>
      <h4>Les soldats de chaque époque</h4>
      <p>L'armée est à part : les soldats ne sont pas des villageois. Ils mangent 1 🍖 pour 4 soldats par jour. <b>En temps de paix, ils chassent</b> : chaque soldat rapporte 1 🍖 par jour (1,25 avec la maîtrise du feu). <b>En temps de guerre</b> (pendant 5 jours après une attaque ou une invasion, signalé par 🔥 en haut de l'écran), ils restent au camp et ne chassent plus. Une trêve arrête aussi ce temps de guerre. Chaque soldat <b>garde les armes de l'époque où il a été recruté</b>.</p>
      <table><tr><th>Ère</th><th>Unité</th><th>Armes</th><th>Force</th><th>Recrutement</th></tr>
      ${E.UNITS.map((u) => `<tr><td>${ERA_ICON[u.era]}</td><td>${u.icon} <b>${u.name}</b></td><td>${u.weapon}</td><td>${String(u.power).replace('.', ',')} ⚔️</td><td>+${u.n} pour ${fmtCost(u.cost)}</td></tr>`).join('')}
      </table>
      <p><b>⚒️ Réarmer</b> : quand vous changez d'ère, vos anciens soldats restent faibles. Le choix « Réarmer les anciens soldats » leur donne les armes de l'ère actuelle (environ 60 % du prix d'une recrue, sans nourriture). Dans les batailles perdues, ce sont les soldats les plus mal armés qui tombent en premier.</p>
      <p>Sur la carte, l'armée s'entraîne à côté du village, avec l'équipement de son époque (lances, boucliers, chevaux, canons, fusils, blindés).</p>
    `));

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
      <li><b>En haut</b> : le jour et le temps qui reste (⏸️ pause, ×1 / ×2 / ×4), votre pays et son ère (touchez-le pour le 📖 journal), la population. Dessous, vos ressources : touchez la ligne pour voir ce que vous gagnez ou perdez chaque jour. Puis l'ennemi de l'ère, qui grandit quand une attaque approche.</li>
      <li><b>☰ Menu</b> : les règles, le journal, ou une nouvelle partie. La partie est sauvegardée automatiquement chaque nuit, dans ce navigateur.</li></ul>`));

    const nav = [['but', 'But'], ['jour', 'Journée'], ['principal', 'Maison commune'], ['recherche', 'Recherche'], ['cartes', 'Catégories'], ['res', 'Ressources'], ['villageois', 'Villageois'], ['peuple', 'Population'], ['eres', 'Ères'], ['guerre', 'Guerre'], ['events', 'Événements'], ['constructions', 'Constructions'], ['lois', 'Lois']];
    return { nav, html: parts.join('') };
  }

  root.Rules = { build };
})(window);
