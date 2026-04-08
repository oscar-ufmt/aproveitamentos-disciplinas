let disciplinasObrigatorias = [];
let disciplinasOptativas = [];

async function carregarDados() {
  try {
    const [resObrig, resOpt] = await Promise.all([
      fetch('disciplinas_obrigatorias.json'),
      fetch('disciplinas_optativas.json')
    ]);
    disciplinasObrigatorias = await resObrig.json();
    disciplinasOptativas = await resOpt.json();

    const savedSEI = localStorage.getItem('sei_aproveitamento');
    if (savedSEI) document.getElementById('processoSEI').value = savedSEI;

    addDisciplina();
  } catch (e) {
    console.error("Erro ao carregar dados", e);
  }
}

function salvarProgresso() {
  localStorage.setItem('sei_aproveitamento', document.getElementById('processoSEI').value);
}

function addDisciplina() {
  const container = document.getElementById("disciplinas-container");
  const id = Date.now();

  const div = document.createElement("div");
  div.className = "card disciplina-block";
  div.id = `block-${id}`;

  div.innerHTML = `
        <div class="card-header">
            <h4>Disciplina para Aproveitar</h4>
            <button onclick="removerBloco('${id}')" class="btn-remove">Remover</button>
        </div>
        
        <div class="grid-form">
            <!-- Linha 1: Origem e Nome -->
            <div class="group">
                <label>IES de Origem</label>
                <select onchange="toggleIES(this)">
                    <option value="UFMT">UFMT</option>
                    <option value="Externa">Instituição Externa</option>
                </select>
                <input type="text" class="ies-outra" placeholder="Nome da Instituição" style="display:none; margin-top:8px;">
            </div>

            <div class="group">
                <label>Disciplina Cursada (Nome)</label>
                <input type="text" class="cursada-nome" placeholder="Ex: Álgebra Linear">
            </div>

            <!-- Linha 2: Dados Técnicos -->
            <div class="group">
                <label>Código da Cursada</label>
                <input type="text" class="cursada-cod" placeholder="Ex: MAT101">
            </div>

            <div class="group">
                <div class="row-flex">
                    <div style="flex:1">
                        <label>Carga Horária</label>
                        <input type="text" class="cursada-ch" placeholder="Ex: 60h">
                    </div>
                    <div style="flex:1">
                        <label>Nota Final</label>
                        <input type="text" class="cursada-nota" placeholder="Ex: 9.0">
                    </div>
                </div>
            </div>

            <!-- Linha 3: Tipo e Equivalente -->
            <div class="group">
                <label>Tipo de Aproveitamento</label>
                <select class="tipo-select" onchange="popularDisciplinas(this)">
                    <option value="">Selecione...</option>
                    <option value="obrigatoria">Obrigatória</option>
                    <option value="optativa">Optativa</option>
                </select>
            </div>

            <div class="group">
                <label>Disciplina Equivalente na UFMT</label>
                <select class="disciplina-ufmt">
                    <option value="">Selecione o tipo primeiro</option>
                </select>
            </div>
        </div>
    `;
  container.appendChild(div);
}

function toggleIES(select) {
  const input = select.nextElementSibling;
  input.style.display = select.value === "Externa" ? "block" : "none";
}

function popularDisciplinas(select) {
  const container = select.closest('.disciplina-block');
  const targetSelect = container.querySelector('.disciplina-ufmt');
  const lista = select.value === 'obrigatoria' ? disciplinasObrigatorias : disciplinasOptativas;

  targetSelect.innerHTML = '<option value="">Selecione a disciplina...</option>';
  lista.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.codigo;
    opt.textContent = `${d.codigo} - ${d.nome} (${d.carga_horaria})`;
    targetSelect.appendChild(opt);
  });
}

function removerBloco(id) {
  const blocks = document.querySelectorAll('.disciplina-block');
  if (blocks.length > 1) document.getElementById(`block-${id}`).remove();
}

function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const sei = document.getElementById('processoSEI').value || "Não informado";

  let y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("UNIVERSIDADE FEDERAL DE MATO GROSSO", 105, y, { align: "center" });
  y += 8;
  doc.setFontSize(11);
  doc.text("REQUERIMENTO DE APROVEITAMENTO DE ESTUDOS", 105, y, { align: "center" });
  y += 12;
  doc.text(`PROCESSO SEI: ${sei}`, 15, y);
  y += 5;
  doc.line(15, y, 195, y);
  y += 10;

  document.querySelectorAll(".disciplina-block").forEach((bloco, index) => {
    if (y > 250) { doc.addPage(); y = 20; }

    const ies = bloco.querySelector('select').value;
    const iesNome = ies === "UFMT" ? "UFMT" : bloco.querySelector('.ies-outra').value;
    const cursada = bloco.querySelector('.cursada-nome').value;
    const codCursada = bloco.querySelector('.cursada-cod').value;
    const nota = bloco.querySelector('.cursada-nota').value;
    const ch = bloco.querySelector('.cursada-ch').value;

    const selectUfmt = bloco.querySelector('.disciplina-ufmt');
    const nomeUfmt = selectUfmt.options[selectUfmt.selectedIndex]?.text || "-";

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ORIGEM: ${iesNome}`, 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Cursada: ${cursada} (${codCursada}) | CH: ${ch} | Nota: ${nota}`, 20, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(`Aproveitar como: ${nomeUfmt}`, 20, y);
    y += 12;
  });

  doc.save(`Aproveitamento_SEI_${sei.replace(/\//g, '-')}.pdf`);
}

function limparFormulario() {
  if(confirm("Deseja limpar todos os dados?")) {
    localStorage.removeItem('sei_aproveitamento');
    window.location.reload();
  }
}

window.onload = carregarDados;