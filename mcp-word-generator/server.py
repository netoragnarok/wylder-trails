#!/usr/bin/env python3
"""
MCP Server — Word Document Generator
Gera documentos .docx a partir de arquivos Markdown do projeto Wylder Trails.
"""

import sys
import json
import os
import re
from pathlib import Path
from datetime import datetime

# ── Dependências ──────────────────────────────────────────────────────────────
try:
    from docx import Document
    from docx.shared import Pt, RGBColor, Inches, Cm
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.style import WD_STYLE_TYPE
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
except ImportError:
    sys.stderr.write("Instale: pip install python-docx\n")
    sys.exit(1)

# ── Caminhos ──────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"
DOCS_DIR.mkdir(exist_ok=True)

MD_FILES = {
    "architecture": PROJECT_ROOT / "ARCHITECTURE.md",
    "stack":        PROJECT_ROOT / "STACK.md",
    "business":     PROJECT_ROOT / "BUSINESS_RULES.md",
    "spec":         PROJECT_ROOT / "SPEC.md",
    "presentation": PROJECT_ROOT / "docs" / "apresentacao.md",
}

# ── Cores da identidade Wylder ─────────────────────────────────────────────
COLOR_PRIMARY   = RGBColor(0x1A, 0x5C, 0x38)  # verde escuro
COLOR_ACCENT    = RGBColor(0xF4, 0xA2, 0x28)  # laranja
COLOR_DARK      = RGBColor(0x1A, 0x20, 0x2C)  # quase preto
COLOR_SECONDARY = RGBColor(0x71, 0x80, 0x96)  # cinza


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers de estilo
# ═══════════════════════════════════════════════════════════════════════════════

def set_cell_bg(cell, hex_color: str):
    """Aplica cor de fundo a uma célula de tabela."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def add_horizontal_rule(doc: Document):
    """Adiciona uma linha horizontal."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "6")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), "2D8A57")
    pBdr.append(bottom)
    pPr.append(pBdr)


def apply_doc_styles(doc: Document):
    """Configura margens e estilos base do documento."""
    section = doc.sections[0]
    section.top_margin    = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin   = Cm(3.0)
    section.right_margin  = Cm(2.5)

    # Normal
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)
    style.font.color.rgb = COLOR_DARK

    # Heading 1
    h1 = doc.styles["Heading 1"]
    h1.font.name = "Calibri"
    h1.font.size = Pt(20)
    h1.font.bold = True
    h1.font.color.rgb = COLOR_PRIMARY
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after  = Pt(6)

    # Heading 2
    h2 = doc.styles["Heading 2"]
    h2.font.name = "Calibri"
    h2.font.size = Pt(15)
    h2.font.bold = True
    h2.font.color.rgb = COLOR_PRIMARY
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after  = Pt(4)

    # Heading 3
    h3 = doc.styles["Heading 3"]
    h3.font.name = "Calibri"
    h3.font.size = Pt(12)
    h3.font.bold = True
    h3.font.color.rgb = COLOR_ACCENT
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after  = Pt(2)

    # List Bullet
    try:
        lb = doc.styles["List Bullet"]
        lb.font.name = "Calibri"
        lb.font.size = Pt(11)
    except Exception:
        pass


def add_cover_page(doc: Document, title: str, subtitle: str = ""):
    """Cria uma capa estilizada."""
    # Espaço topo
    for _ in range(6):
        doc.add_paragraph()

    # Título principal
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("🌲 Wylder Trails")
    run.font.name = "Calibri"
    run.font.size = Pt(32)
    run.font.bold = True
    run.font.color.rgb = COLOR_PRIMARY

    # Subtítulo do documento
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run2 = p2.add_run(title)
    run2.font.name = "Calibri"
    run2.font.size = Pt(20)
    run2.font.color.rgb = COLOR_ACCENT

    if subtitle:
        p3 = doc.add_paragraph()
        p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run3 = p3.add_run(subtitle)
        run3.font.name = "Calibri"
        run3.font.size = Pt(12)
        run3.font.color.rgb = COLOR_SECONDARY

    for _ in range(3):
        doc.add_paragraph()

    # Data e repositório
    p4 = doc.add_paragraph()
    p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run4 = p4.add_run(f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}")
    run4.font.size = Pt(10)
    run4.font.color.rgb = COLOR_SECONDARY

    p5 = doc.add_paragraph()
    p5.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run5 = p5.add_run("github.com/netoragnarok/wylder-trails")
    run5.font.size = Pt(10)
    run5.font.color.rgb = COLOR_PRIMARY

    doc.add_page_break()


# ═══════════════════════════════════════════════════════════════════════════════
# Parser de Markdown → Word
# ═══════════════════════════════════════════════════════════════════════════════

def parse_inline(run, text: str):
    """Aplica bold/italic/code em um run."""
    # Simplificado: aplica o texto puro (formatação inline complexa omitida
    # para manter robustez)
    run.text = text


def md_to_docx(doc: Document, md_text: str):
    """Converte Markdown para elementos Word."""
    lines = md_text.splitlines()
    i = 0
    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []

    while i < len(lines):
        line = lines[i]

        # ── Bloco de código ───────────────────────────────────────────────────
        if line.strip().startswith("```"):
            if not in_code_block:
                in_code_block = True
                code_lines = []
            else:
                in_code_block = False
                code_text = "\n".join(code_lines)
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Cm(1)
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after  = Pt(4)
                run = p.add_run(code_text)
                run.font.name = "Courier New"
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(0x2D, 0x8A, 0x57)
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # ── Tabelas ───────────────────────────────────────────────────────────
        if line.strip().startswith("|"):
            table_rows.append(line)
            i += 1
            # Coleta todas as linhas da tabela
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_rows.append(lines[i])
                i += 1
            render_md_table(doc, table_rows)
            table_rows = []
            continue

        # ── Headings ──────────────────────────────────────────────────────────
        h_match = re.match(r'^(#{1,6})\s+(.*)', line)
        if h_match:
            level = len(h_match.group(1))
            text  = h_match.group(2).strip()
            # Remove emojis de títulos para compatibilidade Word
            text_clean = re.sub(r'[^\x00-\x7F\u00C0-\u024F\s\w\d\.\,\:\;\-\_\(\)\[\]\/\\]', '', text).strip()
            style_map = {1: "Heading 1", 2: "Heading 2", 3: "Heading 3",
                         4: "Heading 3", 5: "Heading 3", 6: "Heading 3"}
            doc.add_paragraph(text_clean or text, style=style_map[level])
            i += 1
            continue

        # ── Linha horizontal ──────────────────────────────────────────────────
        if re.match(r'^[-*_]{3,}\s*$', line.strip()):
            add_horizontal_rule(doc)
            i += 1
            continue

        # ── Lista não-ordenada ────────────────────────────────────────────────
        li_match = re.match(r'^[\s]*[-*+]\s+(.*)', line)
        if li_match:
            text = clean_inline(li_match.group(1))
            p = doc.add_paragraph(style="List Bullet")
            p.paragraph_format.left_indent = Cm(1)
            apply_inline_formats(p, text)
            i += 1
            continue

        # ── Lista ordenada ────────────────────────────────────────────────────
        ol_match = re.match(r'^[\s]*\d+\.\s+(.*)', line)
        if ol_match:
            text = clean_inline(ol_match.group(1))
            p = doc.add_paragraph(style="List Number")
            p.paragraph_format.left_indent = Cm(1)
            apply_inline_formats(p, text)
            i += 1
            continue

        # ── Linha em branco ───────────────────────────────────────────────────
        if not line.strip():
            i += 1
            continue

        # ── Parágrafo normal ──────────────────────────────────────────────────
        text = clean_inline(line)
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        apply_inline_formats(p, text)
        i += 1


def clean_inline(text: str) -> str:
    """Remove sintaxe Markdown inline deixando texto limpo."""
    # Remove links [texto](url) → texto
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    # Remove imagens
    text = re.sub(r'!\[([^\]]*)\]\([^\)]+\)', r'\1', text)
    return text


def apply_inline_formats(p, text: str):
    """Aplica bold, italic e code dentro de um parágrafo."""
    # Padrões: **bold**, *italic*, `code`
    pattern = re.compile(r'(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)')
    last = 0
    for m in pattern.finditer(text):
        # Texto antes do match
        if m.start() > last:
            p.add_run(text[last:m.start()])
        raw = m.group(0)
        if raw.startswith("**"):
            run = p.add_run(m.group(2))
            run.bold = True
        elif raw.startswith("`"):
            run = p.add_run(m.group(4))
            run.font.name = "Courier New"
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(0x2D, 0x8A, 0x57)
        else:
            run = p.add_run(m.group(3))
            run.italic = True
        last = m.end()
    if last < len(text):
        p.add_run(text[last:])


def render_md_table(doc: Document, rows: list):
    """Renderiza uma tabela Markdown como tabela Word estilizada."""
    # Filtra linha separadora (|---|---|)
    data_rows = [r for r in rows if not re.match(r'^\|[\s\-\|:]+\|$', r.strip())]
    if not data_rows:
        return

    parsed = []
    for row in data_rows:
        cells = [c.strip() for c in row.strip().strip("|").split("|")]
        parsed.append(cells)

    if not parsed:
        return

    num_cols = max(len(r) for r in parsed)
    table = doc.add_table(rows=len(parsed), cols=num_cols)
    table.style = "Table Grid"

    for row_idx, row_data in enumerate(parsed):
        row_obj = table.rows[row_idx]
        for col_idx in range(num_cols):
            cell = row_obj.cells[col_idx]
            text = row_data[col_idx] if col_idx < len(row_data) else ""
            text = clean_inline(text)
            cell.text = text
            # Estilo do cabeçalho
            if row_idx == 0:
                set_cell_bg(cell, "1A5C38")
                for para in cell.paragraphs:
                    for run in para.runs:
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                        run.font.size = Pt(10)
            else:
                bg = "F7F8FA" if row_idx % 2 == 0 else "FFFFFF"
                set_cell_bg(cell, bg)
                for para in cell.paragraphs:
                    for run in para.runs:
                        run.font.size = Pt(10)

    doc.add_paragraph()  # espaço após tabela


# ═══════════════════════════════════════════════════════════════════════════════
# Ferramentas MCP
# ═══════════════════════════════════════════════════════════════════════════════

def tool_generate_single(file_key: str) -> dict:
    """Gera um .docx a partir de um arquivo .md específico."""
    if file_key not in MD_FILES:
        return {"error": f"Arquivo '{file_key}' não reconhecido. Use: {list(MD_FILES.keys())}"}

    md_path = MD_FILES[file_key]
    if not md_path.exists():
        return {"error": f"Arquivo não encontrado: {md_path}"}

    titles = {
        "architecture":  "Arquitetura da Solução",
        "stack":         "Stack Tecnológica",
        "business":      "Regras de Negócio",
        "spec":          "Especificação de Feature",
        "presentation":  "Apresentação do Produto",
    }

    md_text = md_path.read_text(encoding="utf-8")
    doc = Document()
    apply_doc_styles(doc)
    add_cover_page(doc, titles[file_key], "Spec Driven Development — Wylder Trails")
    md_to_docx(doc, md_text)

    out_name = f"wylder-trails-{file_key}-{datetime.now().strftime('%Y%m%d')}.docx"
    out_path = DOCS_DIR / out_name
    doc.save(str(out_path))

    return {
        "success": True,
        "file": str(out_path),
        "message": f"Documento gerado: {out_name}",
    }


def tool_generate_complete() -> dict:
    """Gera um único .docx com todos os arquivos .md do projeto."""
    doc = Document()
    apply_doc_styles(doc)
    add_cover_page(
        doc,
        "Documentação Completa",
        "Spec Driven Development — Wylder Trails"
    )

    sections = [
        ("architecture", "Arquitetura da Solução"),
        ("stack",        "Stack Tecnológica"),
        ("business",     "Regras de Negócio"),
        ("spec",         "Especificação de Feature"),
        ("presentation", "Apresentação do Produto"),
    ]

    for key, section_title in sections:
        md_path = MD_FILES[key]
        if not md_path.exists():
            continue

        # Separador de seção
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(f"── {section_title} ──")
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        add_horizontal_rule(doc)

        md_text = md_path.read_text(encoding="utf-8")
        md_to_docx(doc, md_text)
        doc.add_page_break()

    out_name = f"wylder-trails-documentacao-completa-{datetime.now().strftime('%Y%m%d')}.docx"
    out_path = DOCS_DIR / out_name
    doc.save(str(out_path))

    return {
        "success": True,
        "file": str(out_path),
        "message": f"Documentação completa gerada: {out_name}",
    }


def tool_list_files() -> dict:
    """Lista os arquivos .md disponíveis para geração."""
    result = {}
    for key, path in MD_FILES.items():
        result[key] = {
            "path": str(path),
            "exists": path.exists(),
            "size_kb": round(path.stat().st_size / 1024, 1) if path.exists() else 0,
        }
    return {"files": result}


# ═══════════════════════════════════════════════════════════════════════════════
# Protocolo MCP (JSON-RPC sobre stdio)
# ═══════════════════════════════════════════════════════════════════════════════

TOOLS = [
    {
        "name": "generate_word_document",
        "description": "Gera um documento Word (.docx) a partir de um arquivo Markdown do projeto Wylder Trails.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file": {
                    "type": "string",
                    "description": "Qual arquivo gerar. Valores: architecture, stack, business, spec, presentation",
                    "enum": ["architecture", "stack", "business", "spec", "presentation"],
                }
            },
            "required": ["file"],
        },
    },
    {
        "name": "generate_complete_documentation",
        "description": "Gera um único documento Word (.docx) com toda a documentação do projeto (todos os .md juntos).",
        "inputSchema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "list_markdown_files",
        "description": "Lista todos os arquivos Markdown disponíveis para geração de Word.",
        "inputSchema": {
            "type": "object",
            "properties": {},
        },
    },
]


def send(obj: dict):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def handle(req: dict) -> dict:
    method = req.get("method", "")
    req_id = req.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0", "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "wylder-word-generator", "version": "1.0.0"},
            },
        }

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        name   = req.get("params", {}).get("name", "")
        args   = req.get("params", {}).get("arguments", {})

        if name == "generate_word_document":
            result = tool_generate_single(args.get("file", ""))
        elif name == "generate_complete_documentation":
            result = tool_generate_complete()
        elif name == "list_markdown_files":
            result = tool_list_files()
        else:
            result = {"error": f"Ferramenta desconhecida: {name}"}

        is_error = "error" in result
        return {
            "jsonrpc": "2.0", "id": req_id,
            "result": {
                "content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}],
                "isError": is_error,
            },
        }

    if method == "notifications/initialized":
        return None  # notificação, sem resposta

    return {
        "jsonrpc": "2.0", "id": req_id,
        "error": {"code": -32601, "message": f"Método não suportado: {method}"},
    }


def main():
    sys.stderr.write("🌲 Wylder Word Generator MCP Server iniciado\n")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            resp = handle(req)
            if resp is not None:
                send(resp)
        except json.JSONDecodeError as e:
            send({"jsonrpc": "2.0", "id": None,
                  "error": {"code": -32700, "message": f"Parse error: {e}"}})
        except Exception as e:
            send({"jsonrpc": "2.0", "id": None,
                  "error": {"code": -32603, "message": f"Internal error: {e}"}})


if __name__ == "__main__":
    main()
