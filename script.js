/* =========================================================
   Cadastro de Alunos
   Os dados continuam na mesma chave do localStorage, então
   os alunos já cadastrados no programa antigo são mantidos.
   ========================================================= */
const CHAVE = "alunos_cadastro";
const CHAVE_TEMA = "tema_cadastro";
const campos = ["nome", "email", "telefone", "sexo", "data", "cpf", "curso"];
const obrigatorios = ["nome", "email", "telefone", "data", "cpf", "curso"];
const CURSOS_BASE = [
  "Turma A - Python", "Turma B - Python",
  "Turma PHP de manhã", "Turma PHP de tarde",
  "Turma Java", "Turma Web"
];

let alunos = carregar();
let selecionado = null;
let foto = "";
let ordem = { campo: "nome", dir: 1 };

const $ = id => document.getElementById(id);

/* ---------- Armazenamento ---------- */
function carregar() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || []; }
  catch (e) { return []; }
}
function gravar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(alunos)); return true; }
  catch (e) {
    aviso("Não foi possível gravar. A foto pode estar muito grande.", "erro");
    return false;
  }
}

/* ---------- Tema claro / escuro ---------- */
function temaAtual() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
function aplicarTema(t) {
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem(CHAVE_TEMA, t); } catch (e) {}
  $("tema").setAttribute("title", t === "dark" ? "Mudar para o modo claro" : "Mudar para o modo escuro");
}
$("tema").addEventListener("click", () => aplicarTema(temaAtual() === "dark" ? "light" : "dark"));
aplicarTema(temaAtual());

/* ---------- Utilidades ---------- */
let temporizadorAviso;
function aviso(texto, tipo = "ok") {
  const m = $("msg");
  m.textContent = texto;
  m.className = "toast " + tipo + " show";
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => m.classList.remove("show"), 3500);
}

const fmtData = d => d ? d.split("-").reverse().join("/") : "";
const soDigitos = s => (s || "").replace(/\D/g, "");
const norm = s => (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function iniciais(nome) {
  const p = (nome || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}
function matiz(nome) {
  let h = 0;
  for (const ch of nome || "") h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
function confirmar(titulo, texto) {
  return new Promise(resolve => {
    const d = $("confirma");
    $("confirma-titulo").textContent = titulo;
    $("confirma-texto").textContent = texto;
    d.returnValue = "";
    d.addEventListener("close", () => resolve(d.returnValue === "sim"), { once: true });
    d.showModal();
  });
}

/* ---------- Máscaras e validações ---------- */
function mascaraCpf(v) {
  const d = soDigitos(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}
function mascaraTelefone(v) {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d ? "(" + d : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function cpfValido(valor) {
  const c = soDigitos(valor);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(c[t])) return false;
  }
  return true;
}

$("cpf").addEventListener("input", e => { e.target.value = mascaraCpf(e.target.value); });
$("telefone").addEventListener("input", e => { e.target.value = mascaraTelefone(e.target.value); });
$("data").max = hoje();

/* ---------- Erros nos campos ---------- */
function marcarErro(id, texto) {
  const el = $(id);
  el.setAttribute("aria-invalid", "true");
  const msg = el.closest(".campo").querySelector(".erro-txt");
  if (msg) msg.textContent = texto;
}
function limparErros() {
  campos.forEach(c => {
    const el = $(c);
    el.removeAttribute("aria-invalid");
    const msg = el.closest(".campo").querySelector(".erro-txt");
    if (msg) msg.textContent = "";
  });
}
campos.forEach(c => {
  const limpar = () => {
    const el = $(c);
    el.removeAttribute("aria-invalid");
    const msg = el.closest(".campo").querySelector(".erro-txt");
    if (msg) msg.textContent = "";
  };
  $(c).addEventListener("input", limpar);
  $(c).addEventListener("change", limpar);
});

/* ---------- Foto (redimensiona para economizar espaço) ---------- */
$("btn-foto").addEventListener("click", () => $("arquivo").click());
$("btn-remover-foto").addEventListener("click", () => { foto = ""; mostrarFoto(); });

$("arquivo").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    const esc = Math.min(1, 300 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * esc);
    c.height = Math.round(img.height * esc);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    foto = c.toDataURL("image/jpeg", 0.8);
    URL.revokeObjectURL(url);
    mostrarFoto();
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    aviso("Não foi possível abrir essa imagem.", "erro");
  };
  img.src = url;
  e.target.value = "";
});

function mostrarFoto() {
  const img = $("preview");
  if (foto) { img.src = foto; img.hidden = false; }
  else { img.removeAttribute("src"); img.hidden = true; }
  $("preview-vazio").hidden = !!foto;
  $("avatar-grande").classList.toggle("tem-foto", !!foto);
  $("btn-remover-foto").hidden = !foto;
}

/* ---------- Formulário ---------- */
function lerForm() {
  const d = {};
  campos.forEach(c => d[c] = $(c).value.trim());
  d.foto = foto;
  return d;
}

function validar(d) {
  limparErros();
  const erros = [];

  obrigatorios.forEach(c => { if (!d[c]) erros.push([c, "Preencha este campo."]); });

  if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email))
    erros.push(["email", "Email inválido. Exemplo: nome@dominio.com"]);

  if (d.telefone && soDigitos(d.telefone).length < 10)
    erros.push(["telefone", "Telefone incompleto. Informe o DDD e o número."]);

  if (d.cpf) {
    if (!cpfValido(d.cpf)) erros.push(["cpf", "CPF inválido. Confira os números."]);
    else if (alunos.some(a => soDigitos(a.cpf) === soDigitos(d.cpf) && a.id !== selecionado))
      erros.push(["cpf", "Já existe um aluno com esse CPF."]);
  }

  if (d.data && d.data > hoje())
    erros.push(["data", "A data não pode estar no futuro."]);

  if (!erros.length) return true;

  erros.forEach(([c, m]) => { if (!$(c).hasAttribute("aria-invalid")) marcarErro(c, m); });
  $(erros[0][0]).focus();
  aviso(erros.length === 1 ? erros[0][1] : `Corrija ${erros.length} campos destacados.`, "erro");
  return false;
}

function atualizarModo() {
  const editando = selecionado !== null;
  const a = editando ? alunos.find(x => x.id === selecionado) : null;
  $("form-titulo").textContent = editando && a ? a.nome : "Novo aluno";
  $("form-badge").hidden = !editando;
  $("btn-salvar").textContent = editando ? "Salvar alterações" : "Cadastrar aluno";
  $("btn-excluir").disabled = !editando;
}

function salvar() {
  const d = lerForm();
  if (!validar(d)) return;

  if (selecionado === null) {
    d.id = alunos.length ? Math.max(...alunos.map(a => a.id)) + 1 : 1;
    alunos.push(d);
    if (!gravar()) { alunos.pop(); return; }
    novoAluno(false);
    aviso("Aluno cadastrado.");
  } else {
    const i = alunos.findIndex(a => a.id === selecionado);
    const anterior = alunos[i];
    alunos[i] = { ...d, id: selecionado };
    if (!gravar()) { alunos[i] = anterior; return; }
    aviso("Alterações salvas.");
    atualizarModo();
    renderizar();
  }
}

async function excluir() {
  if (selecionado === null) return;
  const a = alunos.find(x => x.id === selecionado);
  const ok = await confirmar("Excluir aluno?", `${a ? a.nome : "Este aluno"} será removido do cadastro. Essa ação não pode ser desfeita.`);
  if (!ok) return;
  alunos = alunos.filter(x => x.id !== selecionado);
  gravar();
  novoAluno(false);
  aviso("Aluno excluído.");
}

function novoAluno(focar = true) {
  selecionado = null;
  foto = "";
  campos.forEach(c => $(c).value = "");
  limparErros();
  mostrarFoto();
  atualizarModo();
  renderizar();
  if (focar) $("nome").focus();
}

function selecionar(id) {
  const a = alunos.find(x => x.id === id);
  if (!a) return;
  selecionado = id;
  foto = a.foto || "";
  campos.forEach(c => $(c).value = a[c] || "");
  limparErros();
  mostrarFoto();
  atualizarModo();
  renderizar();
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  $("form-card").scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
}

$("form").addEventListener("submit", e => { e.preventDefault(); salvar(); });
$("btn-novo").addEventListener("click", () => novoAluno(true));
$("btn-excluir").addEventListener("click", excluir);

/* ---------- Filtros, ordenação e tabela ---------- */
function cursosExistentes() {
  const todos = new Set(CURSOS_BASE);
  alunos.forEach(a => { if (a.curso) todos.add(a.curso); });
  return [...todos].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function atualizarCursos() {
  $("cursos").innerHTML = "";
  cursosExistentes().forEach(c => {
    const o = document.createElement("option");
    o.value = c;
    $("cursos").appendChild(o);
  });

  const filtro = $("filtro-curso");
  const atual = filtro.value;
  filtro.innerHTML = '<option value="">Todos os cursos</option>';
  [...new Set(alunos.map(a => a.curso).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .forEach(c => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      filtro.appendChild(o);
    });
  filtro.value = [...filtro.options].some(o => o.value === atual) ? atual : "";
}

function filtrados() {
  const q = norm($("busca").value.trim());
  const curso = $("filtro-curso").value;
  const lista = alunos.filter(a => {
    if (curso && a.curso !== curso) return false;
    if (!q) return true;
    return norm([a.nome, a.email, a.telefone, a.cpf, a.curso].join(" ")).includes(q);
  });

  const { campo, dir } = ordem;
  lista.sort((a, b) => {
    if (campo === "id") return (a.id - b.id) * dir;
    return (a[campo] || "").toString().localeCompare((b[campo] || "").toString(), "pt-BR", { sensitivity: "base" }) * dir;
  });
  return lista;
}

function criarAvatar(a) {
  const span = document.createElement("span");
  span.className = "av";
  span.style.setProperty("--h", matiz(a.nome));
  if (a.foto) {
    const im = document.createElement("img");
    im.src = a.foto;
    im.alt = "";
    span.appendChild(im);
  } else {
    span.textContent = iniciais(a.nome);
  }
  return span;
}

function renderizar() {
  atualizarCursos();
  const lista = filtrados();
  const corpo = $("corpo");
  corpo.innerHTML = "";

  lista.forEach(a => {
    const tr = document.createElement("tr");
    if (a.id === selecionado) tr.className = "sel";
    tr.tabIndex = 0;
    tr.addEventListener("click", () => selecionar(a.id));
    tr.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selecionar(a.id); }
    });

    const celulas = [
      ["id", a.id], ["foto", null], ["nome", a.nome], ["email", a.email],
      ["telefone", a.telefone], ["sexo", a.sexo], ["data", fmtData(a.data)],
      ["cpf", a.cpf], ["curso", a.curso]
    ];
    celulas.forEach(([tipo, v]) => {
      const td = document.createElement("td");
      td.className = tipo;
      if (tipo === "foto") td.appendChild(criarAvatar(a));
      else td.textContent = v ?? "";
      tr.appendChild(td);
    });
    corpo.appendChild(tr);
  });

  // contagem e estatísticas
  $("contagem").textContent = alunos.length
    ? (lista.length === alunos.length
        ? `${alunos.length} ${alunos.length === 1 ? "aluno" : "alunos"}`
        : `${lista.length} de ${alunos.length} alunos`)
    : "";
  $("stat-total").textContent = alunos.length;
  $("stat-cursos").textContent = new Set(alunos.map(a => a.curso).filter(Boolean)).size;

  // estado vazio
  const vazio = $("vazio");
  if (!lista.length) {
    vazio.hidden = false;
    vazio.innerHTML = alunos.length
      ? "<strong>Nenhum aluno encontrado</strong>Tente outro termo ou limpe os filtros."
      : "<strong>Nenhum aluno cadastrado</strong>Preencha o formulário acima e clique em Cadastrar aluno.";
  } else {
    vazio.hidden = true;
  }

  // indicador de ordenação
  document.querySelectorAll("th .ord").forEach(btn => {
    const ativo = btn.dataset.campo === ordem.campo;
    btn.parentElement.setAttribute("aria-sort", ativo ? (ordem.dir === 1 ? "ascending" : "descending") : "none");
  });
}

document.querySelectorAll("th .ord").forEach(btn => {
  btn.addEventListener("click", () => {
    const campo = btn.dataset.campo;
    ordem = ordem.campo === campo ? { campo, dir: -ordem.dir } : { campo, dir: 1 };
    renderizar();
  });
});

$("busca").addEventListener("input", renderizar);
$("filtro-curso").addEventListener("change", renderizar);
$("btn-limpar-filtros").addEventListener("click", () => {
  $("busca").value = "";
  $("filtro-curso").value = "";
  renderizar();
});

/* ---------- Exportar CSV ---------- */
function exportarCsv() {
  const lista = filtrados();
  if (!lista.length) return aviso("Não há alunos para exportar.", "erro");

  const cab = ["Id", "Nome", "Email", "Telefone", "Sexo", "Nascimento", "CPF", "Curso"];
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const linhas = lista.map(a =>
    [a.id, a.nome, a.email, a.telefone, a.sexo, fmtData(a.data), a.cpf, a.curso].map(esc).join(";")
  );
  // BOM + ponto e vírgula: o Excel em português abre com acentos e colunas corretos
  const csv = "\uFEFF" + [cab.map(esc).join(";"), ...linhas].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `alunos-${hoje()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  aviso(`${lista.length} ${lista.length === 1 ? "aluno exportado" : "alunos exportados"}.`);
}
$("btn-csv").addEventListener("click", exportarCsv);

/* ---------- Início ---------- */
mostrarFoto();
atualizarModo();
renderizar();
