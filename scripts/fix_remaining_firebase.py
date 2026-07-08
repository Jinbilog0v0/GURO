"""
Fix remaining Firebase references in the already-updated proposal document.
"""
from docx import Document
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SRC = 'docs/GURO_Proposal_Updated.docx'
DST = 'docs/GURO_Proposal_Updated.docx'   # overwrite in-place

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def get_text(para):
    return ''.join(t.text for t in para._p.iter(f'{{{W}}}t') if t.text)

def replace_para_text(para, new_text):
    p = para._p
    for child in list(p):
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag in ('r', 'hyperlink', 'ins', 'del'):
            p.remove(child)
    r = OxmlElement('w:r')
    t_el = OxmlElement('w:t')
    t_el.text = new_text
    t_el.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    r.append(t_el)
    p.append(r)

def delete_para(para):
    p = para._p
    parent = p.getparent()
    if parent is not None:
        parent.remove(p)

doc = Document(SRC)
changes = 0

for para in doc.paragraphs:
    t = get_text(para)

    # 1. Remove stale Firebase backend entry in Tools list
    if 'Backend Platform' in t and 'Firebase was used as the backend-as-a-service platform' in t:
        # Delete this leftover paragraph (the new Laravel entry already exists)
        delete_para(para)
        print('[R1] Deleted old Firebase backend Tools entry')
        changes += 1
        continue   # para is gone, skip further checks

    # 2. Research Design — offline-to-online Firebase backend mention
    if 'offline' in t.lower() and 'Firebase backend' in t:
        new_t = t.replace(
            'supported by an offline‑to‑online, queue-based synchronization dashboard using a Firebase backend',
            'supported by an offline-to-online, queue-based synchronization pipeline using the Laravel REST API backend'
        ).replace(
            'using a Firebase backend',
            'using the Laravel REST API backend'
        )
        if new_t != t:
            replace_para_text(para, new_t)
            print('[R2] Fixed Firebase backend in Research Design / deliverables paragraph')
            changes += 1
            continue

    # 3. System Architecture Application Layer — Firebase Cloud Functions
    if 'Firebase Cloud functions to process lessons upon ingest' in t:
        new_t = t.replace(
            'a set of Firebase Cloud functions to process lessons upon ingest, facilitate content approval wor',
            'a server-side Laravel GeminiService to generate AI content upon lesson ingest'
        )
        # More complete replacement
        new_t = t.replace('Firebase Cloud functions to process lessons upon ingest',
                           'a Laravel GeminiService API pipeline to process lessons upon ingest')
        replace_para_text(para, new_t)
        print('[R3] Fixed Firebase Cloud Functions in Arch/App Layer paragraph')
        changes += 1
        continue

    # 4. System Architecture — Firebase Authentication with role-based access
    if 'Firebase Authentication with role-based access' in t:
        new_t = t.replace(
            'teachers and admins authenticate through Firebase Authentication with role-based access',
            'teachers and admins authenticate through Laravel Sanctum bearer-token authentication with role-based access control'
        )
        replace_para_text(para, new_t)
        print('[R4] Fixed Firebase Auth in Arch description paragraph')
        changes += 1
        continue

    # 5. Assumptions and Dependencies — Firebase availability assumption
    if 'Firebase will continue to be available' in t:
        new_t = t.replace(
            'The team presumes that Firebase will continue to be available at a scale sufficient to support pilot deployment',
            'The team presumes that the Laravel 11 backend server and MySQL database will remain operational and accessible during the pilot deployment period'
        )
        replace_para_text(para, new_t)
        print('[R5] Fixed Firebase availability assumption')
        changes += 1
        continue

    # 6. Assumptions — Firebase SDK mention
    if 'Firebase JavaScript/React Native clients' in t:
        new_t = t.replace(
            'the necessary SDK’s for development (the Expo managed platform, and Firebase JavaScript/React Native clients)',
            'the necessary SDKs for development (the Expo managed platform, the React/Vite web toolchain, and the Laravel/Sanctum PHP dependencies) will remain available and maintained for the duration of the project'
        ).replace(
            "the necessary SDK's for development (the Expo managed platform, and Firebase JavaScript/React Native clients)",
            'the necessary SDKs for development (the Expo managed platform, the React/Vite web toolchain, and the Laravel/Sanctum PHP dependencies) will remain available and maintained for the duration of the project'
        )
        replace_para_text(para, new_t)
        print('[R6] Fixed Firebase SDK in Assumptions paragraph')
        changes += 1
        continue

    # 7. API Testing — Firebase Cloud Function endpoints
    if 'Postman was used to test Firebase Cloud Function endpoints' in t:
        new_t = t.replace(
            'Postman was used to test Firebase Cloud Function endpoints during the development of the lesson ingestion',
            'Postman was used to test the GURO Laravel REST API endpoints during the development of the lesson ingestion pipeline'
        )
        replace_para_text(para, new_t)
        print('[R7] Fixed Firebase Cloud Function endpoints in API Testing tools entry')
        changes += 1
        continue

print(f'\nTotal additional changes: {changes}')

doc.save(DST)
print(f'Saved to: {DST}')
