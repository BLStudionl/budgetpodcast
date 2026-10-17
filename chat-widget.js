(function(){
  "use strict";
  var settings = window.BPChatSettings || {};
  var botId = String(settings.conferbotBotId || "").trim();
  var botConfigured = /^[a-f0-9]{24}$/i.test(botId);
  var consentKey = "bp_external_consent_v1";

  function hasConsent(){
    try {return window.localStorage.getItem(consentKey)==="yes";}catch(e){return false;}
  }
  function loadConferbot(){
    if(!botConfigured || document.getElementById("conferbot-js")) return;
    var script=document.createElement("script");
    script.id="conferbot-js";
    script.async=true;
    script.charset="UTF-8";
    script.src="https://cdn.conferbot.com/dist/v1/widget.min.js";
    script.onload=function(){
      if(typeof window.ConferbotWidget==="function") window.ConferbotWidget(botId,"live_chat");
      else mountLocalChat();
    };
    script.onerror=mountLocalChat;
    document.head.appendChild(script);
  }
  // De externe AI wordt alleen geladen na de bestaande cookie-toestemming.
  if(botConfigured && hasConsent()){ loadConferbot(); return; }

  function mountLocalChat(){
    if(document.getElementById("bp-chat-launcher"))return;
    var launcher=document.createElement("button");
    launcher.type="button";
    launcher.id="bp-chat-launcher";
    launcher.className="bp-chat-launcher";
    launcher.setAttribute("aria-expanded","false");
    launcher.setAttribute("aria-controls","bp-chat");
    launcher.textContent="💬 Stel je vraag";
    var panel=document.createElement("section");
    panel.id="bp-chat";
    panel.className="bp-chat";
    panel.hidden=true;
    panel.setAttribute("aria-label","Chat met BudgetPodcast");
    panel.innerHTML='<header class="bp-chat-head"><span class="bp-chat-logo" aria-hidden="true">🎙</span><span><strong>BudgetPodcast</strong><small>Wij helpen je graag verder</small></span><button type="button" id="bp-chat-close" aria-label="Sluit chat">×</button></header>'+
      '<div class="bp-chat-messages" id="bp-chat-messages" role="log" aria-live="polite"></div>'+
      '<div class="bp-chat-actions" id="bp-chat-actions"><button type="button" data-question="Wat kost een opname?">💶 Prijzen</button><button type="button" data-question="Hoe kan ik boeken?">📅 Boeken</button><button type="button" data-question="Hoe lang duurt de opname?">⏱ Opnametijd</button><button type="button" id="bp-chat-human">✉ Persoonlijk contact</button></div>'+
      '<form id="bp-chat-send" class="bp-chat-send"><input id="bp-chat-input" maxlength="600" autocomplete="off" aria-label="Je vraag" placeholder="Typ hier je vraag..." required><button type="submit" aria-label="Verstuur vraag">➤</button></form>'+
      '<form id="bp-chat-lead" class="bp-chat-lead" hidden><strong>Laat een bericht achter</strong><label>Naam<input name="name" required minlength="2" maxlength="100" autocomplete="name"></label><label>E-mailadres<input name="email" type="email" required maxlength="200" autocomplete="email"></label><label>Vraag of verzoek<textarea name="message" required maxlength="2000"></textarea></label><p class="bp-chat-note">We mailen je terug. Je bericht wordt verwerkt om je vraag te beantwoorden. Zie onze <a href="/privacy" target="_blank" rel="noopener">privacyverklaring</a>.</p><button type="submit">Verstuur naar BudgetPodcast</button></form>';
    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    var log=panel.querySelector("#bp-chat-messages");
    var input=panel.querySelector("#bp-chat-input");
    var lead=panel.querySelector("#bp-chat-lead");
    var history=[];
    function addMessage(kind,msg){
      var bubble=document.createElement("div");
      bubble.className="bp-chat-bubble "+kind;
      bubble.textContent=msg;
      log.appendChild(bubble);
      log.scrollTop=log.scrollHeight;
      history.push((kind==="user"?"Bezoeker: ":"Assistent: ")+msg);
    }
    function openChat(){
      panel.hidden=false;
      launcher.setAttribute("aria-expanded","true");
      panel.querySelector("#bp-chat-close").focus();
    }
    function closeChat(){
      panel.hidden=true;
      launcher.setAttribute("aria-expanded","false");
      launcher.focus();
    }
    launcher.addEventListener("click",function(){if(panel.hidden)openChat();else closeChat();});
    panel.querySelector("#bp-chat-close").addEventListener("click",closeChat);
    panel.addEventListener("keydown",function(e){if(e.key==="Escape")closeChat();});
    function handoff(question){
      lead.hidden=false;
      if(question)lead.elements.message.value=question;
      panel.querySelector("#bp-chat-actions").hidden=true;
      panel.querySelector("#bp-chat-send").hidden=true;
      addMessage("bot","Daar help ik je graag persoonlijk mee. Laat hieronder je naam, e-mailadres en vraag achter. Ons team reageert per e-mail.");
      lead.elements.name.focus();
    }
    panel.querySelector("#bp-chat-human").addEventListener("click",function(){handoff(input.value.trim());});
    function normalize(t){return String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
    function includesAny(q,parts){return parts.some(function(p){return q.indexOf(p)!==-1;});}
    function answer(question){
      var q=normalize(question);
      var cfg=typeof siteConfig!=="undefined"?siteConfig:{};
      var p=cfg.pricing||{};
      var price=p.singleEpisodePrice||75,number=p.bundleEpisodes||3,bundle=p.bundlePromoPrice||180;
      var promo=p.promotionActive!==false;
      var bundlePrice=promo?bundle:number*price;
      if(includesAny(q,["mens","medewerker","bellen","persoonlijk","speciale wens","offerte","klacht","problemen"])){handoff(question);return;}
      if(includesAny(q,["prijs","kost","tarief","betalen","euro","duur in euro","korting","aanbieding","pakket"])){
        addMessage("bot","Een losse aflevering kost €"+price+". Een pakket van "+number+" afleveringen kost "+(promo?"tijdelijk ":"")+"€"+bundlePrice+" (€"+(bundlePrice/number).toFixed(0)+" per aflevering). Audio, video en apparatuur zijn inbegrepen. Je kunt direct boeken via de knop 'Boek nu' op de website.");return;
      }
      if(includesAny(q,["verzet","verplaats","annuleer","wijzig mijn","andere datum"])){
        addMessage("bot","Je kunt je opname verzetten wanneer je dat minimaal 48 uur vooraf doorgeeft. Voor andere wijzigingen of annuleringen helpen we je graag persoonlijk.");return;
      }
      if(includesAny(q,["boeken","boeking","boek ","reserver","agenda","beschikbaar","tijdslot","datum","inplannen"])){
        addMessage("bot","Je kunt online boeken via de sectie 'Boek nu'. Daar kies je 1 aflevering of een pakket van "+number+" afleveringen en selecteer je een beschikbaar moment in de Cal.com-agenda. Beschikbare tijden zie je rechtstreeks in die agenda.");return;
      }
      if(includesAny(q,["lang","duur","minuten","studiotijd","opnametijd","tijd in studio"])){
        addMessage("bot","Voor één aflevering boek je 30 minuten studiotijd, waarvan maximaal 20 minuten daadwerkelijke opname. Bij het pakket van "+number+" afleveringen worden de opnames achter elkaar gedaan in één sessie.");return;
      }
      if(includesAny(q,["ontvang","bestand","opsturen","download","klaar","lever","email na","video na"])){
        addMessage("bot","Je ontvangt je audio- en videobestanden binnen 24 uur na de opname per e-mail via een downloadlink.");return;
      }
      if(includesAny(q,["personen","mensen","gast","sprekers","deelnemers","met z'n","met zn"])){
        addMessage("bot","De studio is ingericht voor maximaal twee personen aan tafel. Wil je met meer mensen opnemen? Laat dan een bericht achter, zodat we je persoonlijk kunnen helpen.");return;
      }
      if(includesAny(q,["audio","video","beeld","geluid","camera","apparatuur","microfoon"])){
        addMessage("bot","Bij ieder pakket zijn professionele audio- en video-opnamen en de benodigde apparatuur inbegrepen.");return;
      }
      if(includesAny(q,["ervaring","eerste keer","beginner","helpen","uitleg"])){
        addMessage("bot","Je hebt geen ervaring nodig. De studio en apparatuur staan klaar en we helpen je op weg.");return;
      }
      if(includesAny(q,["waar","locatie","adres","parkeren","bereikbaar","comfortzone"])){
        addMessage("bot","Ons bezoekadres is "+((cfg.contact&&cfg.contact.address)||"Visseringlaan 19, 2288 ER Rijswijk")+". Je kunt de locatie via de contactgegevens op de website openen in Google Maps. Voor specifieke vragen over parkeren of bereikbaarheid helpen we je graag persoonlijk.");return;
      }
      if(includesAny(q,["hoi","hallo","goedemorgen","goedenavond","hey","hi"])){
        addMessage("bot","Hoi! Vraag gerust naar onze prijzen, boekingen, opnametijd of het ontvangen van je bestanden.");return;
      }
      handoff(question);
    }
    function sendQuestion(question){
      if(!question)return;
      addMessage("user",question);
      input.value="";
      answer(question);
    }
    panel.querySelector("#bp-chat-send").addEventListener("submit",function(e){
      e.preventDefault();sendQuestion(input.value.trim());
    });
    panel.querySelectorAll("[data-question]").forEach(function(button){
      button.addEventListener("click",function(){sendQuestion(button.getAttribute("data-question"));});
    });
    lead.addEventListener("submit",async function(e){
      e.preventDefault();
      if(!lead.reportValidity())return;
      var submit=lead.querySelector('button[type="submit"]');
      submit.disabled=true;
      var data=new URLSearchParams({
        "form-name":"bp-chat-overdracht",
        "name":lead.elements.name.value.trim(),
        "email":lead.elements.email.value.trim(),
        "message":lead.elements.message.value.trim(),
        "chat_history":history.join("\n"),
        "bot-field":""
      });
      try{
        var res=await fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:data.toString()});
        if(!res.ok)throw new Error("Niet verwerkt");
        lead.hidden=true;
        addMessage("bot","Bedankt! Je vraag is doorgestuurd. We nemen per e-mail contact met je op.");
      }catch(err){
        submit.disabled=false;
        addMessage("bot","Het versturen is niet gelukt. Stuur je vraag rechtstreeks naar info@budgetpodcast.nl.");
      }
    });
    addMessage("bot","Hoi! 👋 Welkom bij BudgetPodcast. Ik beantwoord veelgestelde vragen over onze studio, prijzen en boekingen. Kom ik er niet uit? Dan kun je je vraag aan ons team sturen.");
  }
  mountLocalChat();
  // Na toestemming kan de externe AI bij een ingeschakelde bot ook zonder herladen starten.
  var accept=document.getElementById("cookieAccept");
  if(botConfigured && accept)accept.addEventListener("click",function(){
    var bubble=document.getElementById("bp-chat-launcher");
    var panel=document.getElementById("bp-chat");
    if(bubble)bubble.remove();
    if(panel)panel.remove();
    loadConferbot();
  });
})();
