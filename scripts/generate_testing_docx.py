import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_testing_docx():
    os.makedirs('docs', exist_ok=True)
    doc = Document()

    # Set Margins
    for section in doc.sections:
        section.top_margin = Inches(0.6)
        section.bottom_margin = Inches(0.6)
        section.left_margin = Inches(0.6)
        section.right_margin = Inches(0.6)

    # 1. Document Header
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("DEPARTMENT OF EDUCATION • REGION IX • DIVISION OF ZAMBOANGA CITY\nZAMBOANGA CENTRAL SCHOOL (SCHOOL ID: 199006)")
    r_inst.font.name = "Calibri"
    r_inst.font.size = Pt(9.5)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(100, 116, 139)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("GURO PILOT TESTING SHEET & PARTICIPANT CREDENTIALS")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(17, 66, 142) # GURO Blue

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Target Roster: Grade 6 – Meyer Marlene Acosta • School Year 2026–2027 • Quarter 1")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 2. Facilitator Quick-Start Cards Table
    card_table = doc.add_table(rows=2, cols=2)
    card_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    card_table.autofit = False

    # Widths
    for row in card_table.rows:
        row.cells[0].width = Inches(3.5)
        row.cells[1].width = Inches(3.5)

    # Teacher Card
    c_teacher = card_table.rows[0].cells[0]
    set_cell_background(c_teacher, "F0F7FF")
    set_cell_margins(c_teacher, 120, 120, 160, 160)
    p_t = c_teacher.paragraphs[0]
    r = p_t.add_run("TEACHER & ADVISER ACCOUNT\n")
    r.font.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(17, 66, 142)
    p_t.add_run("Name: Meyer Marlene Acosta\nEmail: marlene.acosta@guro.app\nPassword: ")
    r_pw = p_t.add_run("Teacher2026!\n")
    r_pw.font.bold = True
    p_t.add_run("Section: Grade 6 - Marlene Acosta\nRoom ID: GURO-6ACOSTA")

    # Parent Card
    c_parent = card_table.rows[0].cells[1]
    set_cell_background(c_parent, "F0FDF4")
    set_cell_margins(c_parent, 120, 120, 160, 160)
    p_p = c_parent.paragraphs[0]
    r = p_p.add_run("PARENT TEST ACCOUNTS\n")
    r.font.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(22, 101, 52)
    p_p.add_run("Account 1: parent.amsid@guro.app (Amsid)\nAccount 2: parent.divina@guro.app (Divina)\nAccount 3: parent.amora@guro.app (Amora)\nPassword: ")
    r_ppw = p_p.add_run("Parent2026!\n")
    r_ppw.font.bold = True
    p_p.add_run("Linking: Enter student 6-digit access code in app")

    # Student Login Instructions (spanning row 1)
    c_inst = card_table.rows[1].cells[0]
    c_inst.merge(card_table.rows[1].cells[1])
    set_cell_background(c_inst, "FFFBEB")
    set_cell_margins(c_inst, 120, 120, 160, 160)
    p_s = c_inst.paragraphs[0]
    r_s = p_s.add_run("ZERO-FRICTION STUDENT LOGIN INSTRUCTIONS FOR PROCTORS:\n")
    r_s.font.bold = True
    r_s.font.size = Pt(10.5)
    r_s.font.color.rgb = RGBColor(180, 83, 9)
    p_s.add_run("1. Students do NOT need to type an email. They simply enter their ")
    r_b = p_s.add_run("12-Digit LRN")
    r_b.font.bold = True
    p_s.add_run(" directly into the login input box.\n2. Password for ALL students is set to: ")
    r_pw2 = p_s.add_run("Guro2026!\n")
    r_pw2.font.bold = True
    p_s.add_run("3. The mobile app will immediately load their profile, Grade 6 section, Mathematics (Fractions/Decimals/Percentages) & English (Story Elements/Figures of Speech) lessons.")

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. Student Roster Table
    # 38 students
    students = [
        # MALES (8)
        (1, "Amsid, Albvin Martinez", "Male", "126207190184", "Guro2026!", "881204", "Almer Amsid"),
        (2, "Divina, Paul Francis Corpus", "Male", "159006200307", "Guro2026!", "329581", "Rhomel Divina"),
        (3, "Hussain, Russell Rose Nurie", "Male", "199006200120", "Guro2026!", "741295", "Rosmer Hussain"),
        (4, "Lumandong, Shukree Ibrahim", "Male", "199006160300", "Guro2026!", "652194", "Saraban Lumandong"),
        (5, "Muharrani, Mohammad Izyan Akari", "Male", "199006200081", "Guro2026!", "918230", "Yaser Muharrani"),
        (6, "Paragas, Xhian Franz Babiera", "Male", "126108200068", "Guro2026!", "402918", "Shincain Paragas"),
        (7, "Ruelo, Nicko John Acabo", "Male", "199006200150", "Guro2026!", "583921", "Lei Ruelo"),
        (8, "Sanguila, Judielle Puyod", "Male", "199006200277", "Guro2026!", "674829", "Samson Sanguila"),

        # FEMALES (30)
        (9, "Abdurahman, Dezza Mae Sanang", "Female", "199006200086", "Guro2026!", "738192", "Putor Abdurahman"),
        (10, "Ajibul, Aniqa Hadjiruddin", "Female", "199006200215", "Guro2026!", "847291", "Margani Ajibul"),
        (11, "Alid, Norbaida Sabdani", "Female", "125909200090", "Guro2026!", "629384", "Abdulbayan Alid"),
        (12, "Alie, Shane", "Female", "126203200097", "Guro2026!", "518293", "Rose Fay Alie"),
        (13, "Amora, Ysabella Pauline Salvador", "Female", "199006200102", "Guro2026!", "492817", "Salvador Amora"),
        (14, "Ascabano, Cheleslie Rae Garcitos", "Female", "199006200304", "Guro2026!", "384910", "Garcitos Ascabano"),
        (15, "Bandahala, Fatima Sarah Nassal", "Female", "199006200197", "Guro2026!", "748291", "Nassal Bandahala"),
        (16, "Caputilla, Althea Kisses Garcitos", "Female", "125533200014", "Guro2026!", "958204", "Garcitos Caputilla"),
        (17, "Climaco, Francesca Pilar Dayak", "Female", "126225200115", "Guro2026!", "619284", "Dayak Climaco"),
        (18, "Espinosa, Steffie Cayetano", "Female", "199006200010", "Guro2026!", "839401", "Cayetano Espinosa"),
        (19, "Guzman, Alhya Mheel Benzonan", "Female", "199006200224", "Guro2026!", "728491", "Benzonan Guzman"),
        (20, "Iyang, Raaina Daham", "Female", "136476200214", "Guro2026!", "592819", "Daham Iyang"),
        (21, "Maddan, Menalyn Jumala", "Female", "217061190010", "Guro2026!", "839102", "Jumala Maddan"),
        (22, "Maglasang, Brianna Keith Saga", "Female", "126108200080", "Guro2026!", "482910", "Saga Maglasang"),
        (23, "Nixon, Farhata Abdulmajid", "Female", "199006200231", "Guro2026!", "619382", "Abdulmajid Nixon"),
        (24, "Petring, Mia Mohammad", "Female", "199006200232", "Guro2026!", "748190", "Mohammad Petring"),
        (25, "Prado, Lyniel Myrrh Ancero", "Female", "126215190039", "Guro2026!", "839201", "Ancero Prado"),
        (26, "Resola, Allenjiea De Leon", "Female", "126151200002", "Guro2026!", "928301", "De Leon Resola"),
        (27, "Saballa, Shaimae Atara", "Female", "199006200096", "Guro2026!", "619204", "Atara Saballa"),
        (28, "Sahirani, Fatima Irene Pindatun", "Female", "199006200005", "Guro2026!", "583912", "Pindatun Sahirani"),
        (29, "Samad, Alyana Jackaria", "Female", "133065180033", "Guro2026!", "738291", "Jackaria Samad"),
        (30, "Sarahani, Sczhyne Nerelie Ramos", "Female", "199006200007", "Guro2026!", "847192", "Ramos Sarahani"),
        (31, "Sebial, Mitch Arceno", "Female", "125888200016", "Guro2026!", "629481", "Arceno Sebial"),
        (32, "Suhaili, Fatima Sharifa Padilla", "Female", "199006200087", "Guro2026!", "518392", "Padilla Suhaili"),
        (33, "Tan, Jannica Ponce", "Female", "199006200082", "Guro2026!", "492018", "Ponce Tan"),
        (34, "Tomong, Mary Yvonne Mira", "Female", "199006200061", "Guro2026!", "839104", "Mira Tomong"),
        (35, "Torres, Paula Franchesca Mariano", "Female", "199006200070", "Guro2026!", "728193", "Mariano Torres"),
        (36, "Traigo, Zyana Bernadette Adora", "Female", "199006200072", "Guro2026!", "619302", "Adora Traigo"),
        (37, "Tutong, Fatima Nezreen Jikirani", "Female", "199006200008", "Guro2026!", "583920", "Jikirani Tutong"),
        (38, "Usman, Wadznalyn Alpha", "Female", "199006200088", "Guro2026!", "849201", "Alpha Usman"),
    ]

    p_tbl_title = doc.add_paragraph()
    r_tt = p_tbl_title.add_run("OFFICIAL STUDENT TESTING ROSTER (38 LEARNERS)")
    r_tt.font.name = "Arial"
    r_tt.font.size = Pt(12)
    r_tt.font.bold = True
    r_tt.font.color.rgb = RGBColor(17, 66, 142)

    table = doc.add_table(rows=len(students) + 1, cols=7)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header Row
    headers = ["#", "Learner Full Name", "Sex", "12-Digit LRN (Login ID)", "Password", "Parent Code", "Attended"]
    col_widths = [Inches(0.35), Inches(2.2), Inches(0.55), Inches(1.5), Inches(0.9), Inches(0.9), Inches(0.7)]

    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "11428E") # Dark Blue
        set_cell_margins(hdr_cells[i], 100, 100, 100, 100)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i in [0, 2, 4, 5, 6] else WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.name = "Calibri"
            run.font.size = Pt(9)
            run.font.color.rgb = RGBColor(255, 255, 255)

    # Populate Data
    for row_idx, st in enumerate(students, start=1):
        num, name, sex, lrn, pw, code, parent = st
        row_cells = table.rows[row_idx].cells
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"

        values = [str(num), name, "M" if sex == "Male" else "F", lrn, pw, code, "[   ]"]

        for col_idx, val in enumerate(values):
            cell = row_cells[col_idx]
            cell.text = val
            cell.width = col_widths[col_idx]
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, 70, 70, 90, 90)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx in [0, 2, 4, 5, 6] else WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(8.5)
                if col_idx == 3: # LRN
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(17, 66, 142)
                elif col_idx == 5: # Parent code
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(22, 101, 52)
                elif col_idx == 6: # Checkbox
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(148, 163, 184)
                else:
                    run.font.color.rgb = RGBColor(30, 41, 59)

    out_path = os.path.abspath("docs/GURO_Grade6_Acosta_Testing_Sheets.docx")
    doc.save(out_path)
    print(f"Generated successfully: {out_path}")

if __name__ == "__main__":
    create_testing_docx()
