(function(){
  console.log('[boot] script carregado');

  document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('contatoForm');
    const toast = document.getElementById('toast');
    const statusHint = document.getElementById('statusHint');
    const tel = document.getElementById('telefone');
    const enviarBtn = document.getElementById('enviarBtn');

    // 👉 TROQUE AQUI se quiser outro endpoint
    const WEBHOOK_URL = 'https://webhooks.coraxy.com.br/webhook/97a8d12d-958d-4f21-97a7-9e3cd20128cb';

    if (!form) { console.warn('[boot] form #contatoForm NÃO encontrado'); return; }
    console.log('[boot] form encontrado');

    // Máscara de telefone sem usar contrabarras em regex (evita conflitos no editor)
    if (tel) {
      tel.addEventListener('input', () => {
        const digits = (tel.value || '').replace(/[^0-9]/g, '').slice(0, 11);
        let out = '';
        if (digits.length > 0) out += '(' + digits.slice(0,2) + ')';
        if (digits.length >= 7) out += ' ' + digits.slice(2,7) + '-' + digits.slice(7);
        else if (digits.length > 2) out += ' ' + digits.slice(2);
        tel.value = out;
      });
    }

    function setValidity(fieldEl, ok){ if (fieldEl) fieldEl.classList.toggle('invalid', !ok); }

    function validate(){
      const nomeEl = document.getElementById('nome');
      const emailEl = document.getElementById('email');
      const assuntoEl = document.getElementById('assunto');
      const msgEl = document.getElementById('mensagem');

      const vNome = (nomeEl?.value.trim().length || 0) >= 3;
      const vEmail = emailEl ? emailEl.checkValidity() : true; // usa validação nativa do type="email"
      const vAssunto = !!assuntoEl && assuntoEl.value !== '' && assuntoEl.value != null;
      const vMsg = (msgEl?.value.trim().length || 0) >= 10;

      setValidity(nomeEl.closest('.field'), vNome);
      setValidity(emailEl.closest('.field'), vEmail);
      setValidity(assuntoEl.closest('.field'), vAssunto);
      setValidity(msgEl.closest('.field'), vMsg);

      return vNome && vEmail && vAssunto && vMsg;
    }

    function formToJSON(formEl){
      const fd = new FormData(formEl);
      const obj = Object.fromEntries(fd.entries());
      obj.aceitaContato = !!formEl.aceitaContato?.checked;
      return obj;
    }

    form.addEventListener('input', validate);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('[submit] disparado');
      if (!validate()){
        statusHint.textContent = 'Corrija os campos destacados.';
        return;
      }
      const payload = formToJSON(form);
      statusHint.textContent = 'Enviando…';
      enviarBtn.disabled = true;

      const send = (headers, body) => fetch(WEBHOOK_URL, { method: 'POST', headers, body });

      try {
        console.log('[form] payload', payload);
        let resp = await send({ 'Content-Type':'application/json' }, JSON.stringify(payload));
        let text = await resp.text();
        console.log('[form] JSON resp', resp.status, text);
        if (!resp.ok) throw new Error('HTTP '+resp.status+' — '+text.slice(0,200));

        toast.classList.add('show');
        setTimeout(()=> toast.classList.remove('show'), 3000);
        form.reset();
        statusHint.textContent = 'Pronto!';
      } catch (e1) {
        console.warn('[form] JSON falhou, tentando x-www-form-urlencoded', e1.message);
        try {
          let resp2 = await send({ 'Content-Type':'application/x-www-form-urlencoded' }, new URLSearchParams(payload));
          let text2 = await resp2.text();
          console.log('[form] FORM resp', resp2.status, text2);
          if (!resp2.ok) throw new Error('HTTP '+resp2.status+' — '+text2.slice(0,200));
          toast.classList.add('show');
          setTimeout(()=> toast.classList.remove('show'), 3000);
          form.reset();
          statusHint.textContent = 'Pronto!';
        } catch (e2) {
          statusHint.textContent = 'Erro ao enviar. Veja o Console.';
          console.error('[form] Falhou JSON e FORM', e2);
          alert('Erro no envio: ' + (e2.message || e2));
        }
      } finally {
        enviarBtn.disabled = false;
      }
    });

  });

  window.addEventListener('error', (e)=>{
    console.error('[global error]', e.message, e.filename+':'+e.lineno+':'+e.colno);
  });
  window.addEventListener('unhandledrejection', (e)=>{
    console.error('[unhandledrejection]', e.reason);
  });
})();