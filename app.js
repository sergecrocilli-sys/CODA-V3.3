// CODA V3.3 — Assistant local métier de préparation de réponses.
// Pas de connexion mail. Pas d'envoi automatique. Validation humaine obligatoire.

let state={profile:"industrie",style:"chaleureux",signature:"Serge Crocilli"};

const PROFILE_LABELS={
  "industrie":"Industrie / SAV / maintenance",
  "artisan":"Artisan / dépannage",
  "expert-comptable":"Expert-comptable / administratif",
  "avocat":"Avocat / juridique",
  "sante":"Santé / cabinet médical",
  "commerce":"Commerce / relation client",
  "general":"Généraliste professionnel"
};

function goTo(screenId){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  const target=document.getElementById(screenId);
  if(target){
    target.classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  if(screenId==="screen-workspace"&&window.CODA_DATE){
    window.CODA_DATE.renderTodayLabel("today-label");
  }
}

function saveSetup(){
  state.profile=document.getElementById("business-profile")?.value||"general";
  state.style=document.getElementById("reply-style")?.value||"chaleureux";
  state.signature=document.getElementById("signature")?.value.trim()||"Signature";

  localStorage.setItem("coda_v3_profile",state.profile);
  localStorage.setItem("coda_v3_style",state.style);
  localStorage.setItem("coda_v3_signature",state.signature);

  updateAnalysisPlaceholders();
  goTo("screen-workspace");
}

function restoreSetup(){
  state.profile=localStorage.getItem("coda_v3_profile")||"industrie";
  state.style=localStorage.getItem("coda_v3_style")||"chaleureux";
  state.signature=localStorage.getItem("coda_v3_signature")||"Serge Crocilli";

  setValue("business-profile",state.profile);
  setValue("reply-style",state.style);
  setValue("signature",state.signature);
}

function setValue(id,value){
  const el=document.getElementById(id);
  if(el)el.value=value;
}

function setText(id,value){
  const el=document.getElementById(id);
  if(el)el.textContent=value;
}

function updateAnalysisPlaceholders(){
  setText("analysis-profile",PROFILE_LABELS[state.profile]||"Généraliste professionnel");
}

function normalizeText(value){
  return(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

function containsAny(text,words){
  return words.some(w=>text.includes(normalizeText(w)));
}

function detectType(subject,body){
  const text=normalizeText(subject+" "+body);

  if(containsAny(text,[
  "merci",
  "remercier",
  "remerciement",
  "satisfait",
  "tres satisfait",
  "content",
  "ravi",
  "excellent",
  "parfait",
  "tres bien",
  "qualite de service",
  "qualite de votre accompagnement",
  "professionnalisme",
  "disponibilite",
  "reactivite",
  "patience",
  "ecoute",
  "conseil",
  "accompagnement",
  "service client",
  "bon accueil",
  "travail soigne",
  "intervention efficace",
  "resultat conforme",
  "je recommande"
]))return"Remerciement / retour positif";

  if(containsAny(text,["urgence","urgent","douleur","fuite","panne","arret","bloque","incident","sinistre"]))return"Urgence / situation bloquante";
  if(containsAny(text,["incoherence","ecart","erreur","retard","consequence","probleme comptable","rapprochement bancaire"]))return"Réclamation / incohérence administrative";
  if(containsAny(text,["devis","offre","prix","tarif","chiffrage","proposition"]))return"Demande de devis";
  if(containsAny(text,["facture","reglement","paiement","relance","comptabilite"]))return"Facturation / administratif";
  if(containsAny(text,["rendez-vous","rendez vous","rdv","creneau","disponibilite"]))return"Rendez-vous / planification";
  if(containsAny(text,["reclamation","mecontent","litige","insatisfait"]))return"Réclamation";
  if(containsAny(text,["document","piece jointe","attestation","contrat","dossier"]))return"Demande de documents";
  return"Demande professionnelle générale";
}

function detectPriority(subject,body,type){
  const text=normalizeText(subject+" "+body);
  if(type.includes("Urgence"))return"Haute";
  if(containsAny(text,["aujourd'hui","ce matin","bloquant","production arretee","immediat","sans delai"]))return"Haute";
  if(containsAny(text,["consequence","retard","incoherence","ecart","relance","avant demain","rapidement","des que possible"]))return"Moyenne";
  return"Normale";
}

function getMissingInfo(profile,type){
  if(type.includes("Urgence")){
    switch(profile){
      case"industrie":return["Référence de l’équipement","Ligne concernée","Message d’erreur ou symptôme","Impact production","Photos ou vidéo si possible"];
      case"artisan":return["Adresse d’intervention","Numéro de téléphone","Photos du problème","Accès au site ou au logement","Niveau d’urgence réel"];
      case"sante":return["Coordonnées directes du patient","Disponibilités","Éléments utiles pour orienter la prise en charge","Rappel de contacter les urgences si situation grave"];
      case"expert-comptable":return["Dossier concerné","Échéance exacte","Document manquant","Personne référente"];
      case"avocat":return["Contexte du dossier","Échéance procédurale éventuelle","Documents disponibles","Coordonnées complètes"];
      case"commerce":return["Numéro de commande","Référence client","Produit concerné","Délai attendu"];
      default:return["Coordonnées","Contexte","Échéance","Pièces utiles"];
    }
  }

  if(type.includes("incohérence")||type.includes("Réclamation / incohérence")){
    return["Écritures ou factures concernées","Écarts constatés","Montants concernés","Période concernée","Pièces justificatives utiles"];
  }
  if(type.includes("Devis"))return["Besoin exact","Quantité ou périmètre","Délai souhaité","Coordonnées complètes"];
  if(type.includes("Facturation"))return["Numéro de facture","Montant concerné","Date attendue","Référence dossier"];
  if(type.includes("Rendez-vous"))return["Créneaux disponibles","Objet du rendez-vous","Coordonnées","Lieu ou mode d’échange"];
  if(type.includes("Réclamation"))return["Référence dossier","Description précise","Impact","Attente du client"];
  return["Contexte de la demande","Échéance","Coordonnées","Documents utiles si nécessaire"];
}

function analyzeAndGenerate(){
  const subject=document.getElementById("mail-subject").value.trim();
  const body=document.getElementById("mail-body").value.trim();

  if(!subject&&!body){
    alert("Collez au minimum le contenu du mail reçu. L’objet est facultatif.");
    return;
  }

  const type=detectType(subject,body);
  const priority=detectPriority(subject,body,type);
  const missingInfo=getMissingInfo(state.profile,type);
  const reply=generateReply(type,priority);

  setText("analysis-type",type);
  setText("analysis-priority",priority);
  setText("analysis-profile",PROFILE_LABELS[state.profile]||"Généraliste professionnel");
  renderMissingInfo(missingInfo);

  const output=document.getElementById("reply-output");
  if(output)output.value=reply;

  setText("copy-status","");
}

function renderMissingInfo(items){
  const ul=document.getElementById("missing-info");
  if(!ul)return;
  ul.innerHTML="";
  items.forEach(item=>{
    const li=document.createElement("li");
    li.textContent=item;
    ul.appendChild(li);
  });
}

function generateReply(type,priority){
  let core="";

 if(type.includes("Remerciement")){
  core=positiveFeedbackReplyByProfile(state.profile);
}else if(type.includes("Urgence")){
  core=urgentReplyByProfile(state.profile);
}else if(type.includes("incohérence")||type.includes("Réclamation / incohérence")){
  core=sensitiveAdminReplyByProfile(state.profile);
}else if(type.includes("Devis")){
    core="Merci pour votre demande. Je vais analyser les éléments transmis afin de vous apporter une réponse adaptée.\n\nAfin de préparer une proposition pertinente, pouvez-vous me préciser le périmètre exact de votre besoin, le délai souhaité et les éventuelles contraintes à prendre en compte ?";
  }else if(type.includes("Facturation")){
    core="Merci pour votre message. Je prends bonne note de votre demande concernant la facturation.\n\nPouvez-vous me confirmer la référence de la facture ou du dossier concerné afin que je puisse vérifier les éléments et revenir vers vous avec une réponse précise ?";
  }else if(type.includes("Rendez-vous")){
    core="Merci pour votre message. Je vous propose que nous convenions d’un créneau adapté.\n\nPouvez-vous me transmettre vos disponibilités ou me confirmer les créneaux qui vous conviendraient le mieux ?";
  }else if(type.includes("Réclamation")){
    core="Merci pour votre message. Je prends votre retour en considération.\n\nAfin de traiter votre demande de manière rigoureuse, pouvez-vous me transmettre les éléments de contexte, la référence du dossier concerné et l’impact constaté ?";
  }else{
    core="Merci pour votre message. Je prends bonne note de votre demande.\n\nAfin de vous répondre de manière précise, pouvez-vous me transmettre les éléments complémentaires utiles au traitement de votre demande ?";
  }

  if(priority==="Haute"&&!type.includes("Urgence")){
    core+="\n\nJe note également le caractère prioritaire de votre demande et reviens vers vous dès que possible.";
  }

  return `${getIntro()}\n\n${core}\n\n${getClosing()}\n${state.signature}`.trim();
}

function positiveFeedbackReplyByProfile(profile){
  if(profile==="commerce"){
    return"Merci beaucoup pour votre message et pour votre retour positif.\n\nNous sommes ravis de savoir que vous êtes satisfait de votre expérience et de la qualité de l’accompagnement apporté.\n\nVotre retour est très apprécié par l’équipe, car nous accordons beaucoup d’importance à l’accueil, au conseil et à la qualité du service rendu.\n\nAu plaisir de vous revoir prochainement.";
  }

  if(profile==="artisan"){
    return"Merci beaucoup pour votre message et pour votre retour positif.\n\nJe suis ravi de savoir que l’intervention et l’accompagnement apportés vous ont donné satisfaction.\n\nVotre retour est très apprécié et m’encourage à poursuivre dans cette qualité de service.\n\nAu plaisir de vous accompagner à nouveau si besoin.";
  }

  if(profile==="industrie"){
    return"Merci beaucoup pour votre message et pour votre retour positif.\n\nJe suis ravi de savoir que l’accompagnement apporté a répondu à vos attentes.\n\nVotre retour est très apprécié, car nous accordons beaucoup d’importance à la qualité du suivi, à la réactivité et à la pertinence des solutions proposées.\n\nAu plaisir de poursuivre nos échanges.";
  }

  return"Merci beaucoup pour votre message et pour votre retour positif.\n\nJe suis ravi de savoir que l’accompagnement apporté vous a donné satisfaction.\n\nVotre message est très apprécié et m’encourage à poursuivre dans cette qualité de service.\n\nAu plaisir d’échanger à nouveau avec vous.";
}

function urgentReplyByProfile(profile){
  switch(profile){
    case"industrie":return"Merci pour votre message. Je prends bien en compte le caractère bloquant de la situation.\n\nAfin de qualifier rapidement la demande, pouvez-vous me transmettre la référence de l’équipement, la ligne concernée, le message d’erreur affiché et l’impact actuel sur la production ?\n\nDès réception de ces éléments, je reviens vers vous pour organiser la suite.";
    case"artisan":return"Merci pour votre message. Je prends bien en compte le caractère urgent de votre demande.\n\nDans l’immédiat, si cela est possible et sans risque, je vous invite à sécuriser la situation. Pouvez-vous me transmettre votre adresse, un numéro de téléphone et quelques photos du problème afin que je puisse évaluer l’intervention ?";
    case"sante":return"Merci pour votre message. Je prends bien en compte le caractère urgent de votre demande.\n\nAfin d’orienter votre demande dans les meilleures conditions, je vous invite à contacter directement le cabinet. En cas de douleur très intense, de symptôme inhabituel ou de situation préoccupante, il est préférable de vous rapprocher d’un service médical d’urgence.";
    case"expert-comptable":return"Merci pour votre message. Je prends bien en compte le caractère urgent de votre demande.\n\nAfin de prioriser correctement le traitement, pouvez-vous me préciser le dossier concerné, l’échéance exacte et les documents ou informations manquants ?";
    case"avocat":return"Merci pour votre message. Je prends bien en compte l’urgence signalée.\n\nAfin d’apprécier correctement la situation, pouvez-vous me transmettre les éléments de contexte, les documents utiles et toute échéance à respecter ? Cette première réponse ne constitue pas une analyse juridique complète du dossier.";
    case"commerce":return"Merci pour votre message. Je prends bien en compte le caractère urgent de votre demande.\n\nPouvez-vous me transmettre la référence de commande, le produit concerné et le délai attendu afin que je puisse vérifier la situation et revenir vers vous rapidement ?";
    default:return"Merci pour votre message. Je prends bien en compte le caractère urgent de votre demande.\n\nPouvez-vous me transmettre les éléments complémentaires utiles afin que je puisse qualifier la situation et revenir vers vous rapidement ?";
  }
}

function sensitiveAdminReplyByProfile(profile){
  if(profile==="expert-comptable"){
    return"Merci pour votre message. Je comprends votre préoccupation concernant les incohérences relevées, notamment sur les écritures, les factures fournisseurs ou le rapprochement bancaire.\n\nAfin de reprendre le dossier de manière fiable, pouvez-vous me transmettre les écritures ou factures concernées, les montants identifiés ainsi que les écarts que vous avez constatés ?\n\nCes éléments me permettront de vérifier précisément la situation, de régulariser les écritures si nécessaire et de vous faire un retour clair sur les corrections à apporter.\n\nJe vais traiter ce point avec attention et revenir vers vous dès que possible.";
  }

  return"Merci pour votre message. Je comprends votre préoccupation concernant les éléments signalés.\n\nAfin de reprendre le sujet de manière rigoureuse, pouvez-vous me transmettre les références concernées, les écarts constatés et les pièces utiles à la vérification ?\n\nJe vais vérifier les éléments afin de vous apporter une réponse claire et précise.";
}

function getIntro(){
  if(state.style==="formel")return"Madame, Monsieur,";
  return"Bonjour,";
}

function getClosing(){
  if(state.style==="formel")return"Veuillez agréer, Madame, Monsieur, l’expression de mes salutations distinguées.";
  if(state.style==="concis")return"Cordialement,";
  return"Bien cordialement,";
}

function copyReply(){
  const textarea=document.getElementById("reply-output");
  const status=document.getElementById("copy-status");
  if(!textarea||!textarea.value.trim())return;

  navigator.clipboard.writeText(textarea.value)
    .then(()=>{
      if(status)status.textContent="Réponse copiée. Vous pouvez maintenant la relire, l’adapter et la coller dans votre messagerie.";
    })
    .catch(()=>{
      textarea.select();
      document.execCommand("copy");
      if(status)status.textContent="Réponse copiée.";
    });
}

function insertSample(){
  const profile=state.profile;
  const subject=document.getElementById("mail-subject");
  const body=document.getElementById("mail-body");

  const samples={
    industrie:{subject:"Ligne de production arrêtée depuis ce matin",body:"Bonjour,\n\nNotre trieuse pondérale est à l’arrêt depuis ce matin sur la ligne 2. Pouvez-vous intervenir rapidement ?\n\nCordialement,"},
    artisan:{subject:"Fuite importante sous évier",body:"Bonjour,\n\nJ’ai une fuite importante sous l’évier depuis ce matin. Pouvez-vous intervenir rapidement ?\n\nMerci."},
    "expert-comptable":{subject:"Incohérences dans les écritures du mois de février",body:"Bonjour,\n\nAprès vérification de mes derniers documents, j’ai constaté plusieurs incohérences dans les écritures du mois de février, notamment sur le traitement des factures fournisseurs et le rapprochement bancaire. Ces écarts génèrent aujourd’hui un retard dans mes propres obligations administratives, ce qui n’est pas sans conséquence pour mon activité.\n\nPouvez-vous m’indiquer sous quel délai une régularisation peut être effectuée et me proposer un point téléphonique afin de faire le tour complet du dossier ?\n\nCordialement,"},
    avocat:{subject:"Urgence dossier litige",body:"Bonjour Maître,\n\nNous venons de recevoir un courrier avec une échéance très courte. Pouvez-vous nous indiquer les éléments à vous transmettre ?\n\nCordialement,"},
    sante:{subject:"Douleur importante depuis hier soir",body:"Bonjour Docteur,\n\nJe souffre d’une douleur très forte depuis hier soir. Est-il possible d’avoir un rendez-vous rapidement ?\n\nMerci beaucoup."},
    commerce:{subject:"Commande urgente non reçue",body:"Bonjour,\n\nMa commande devait arriver hier et je n’ai toujours rien reçu. Pouvez-vous me dire où cela en est ?\n\nCordialement,"},
    general:{subject:"Demande urgente",body:"Bonjour,\n\nJe vous contacte concernant une demande urgente. Pouvez-vous revenir vers moi rapidement ?\n\nCordialement,"}
  };

  const sample=samples[profile]||samples.general;
  if(subject)subject.value=sample.subject;
  if(body)body.value=sample.body;
}

function goHome(){
  resetWorkspace(false);
  goTo("screen-splash");
}

function resetWorkspace(stayOnWorkspace=true){
  const subject=document.getElementById("mail-subject");
  const body=document.getElementById("mail-body");
  const output=document.getElementById("reply-output");

  if(subject)subject.value="";
  if(body)body.value="";
  if(output)output.value="";

  setText("analysis-type","—");
  setText("analysis-priority","—");
  setText("analysis-profile",PROFILE_LABELS[state.profile]||"Généraliste professionnel");
  setText("copy-status","");

  const ul=document.getElementById("missing-info");
  if(ul)ul.innerHTML="<li>Collez un message puis lancez l’analyse.</li>";

  if(stayOnWorkspace)goTo("screen-workspace");
}

function init(){
  restoreSetup();
  updateAnalysisPlaceholders();
  if(window.CODA_DATE)window.CODA_DATE.renderTodayLabel("today-label");
}

document.addEventListener("DOMContentLoaded",init);
