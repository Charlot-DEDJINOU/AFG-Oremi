import sys
import requests

API_URL = 'https://api.ocr.space/parse/image'
API_KEY = 'K84258587488957'   

def ocr_file(path):
    """
    Sends an image or PDF to OCR.Space and returns the extracted text.
    `languages` is a comma-separated list of ISO codes (e.g. 'eng,fre').
    """
    with open(path, 'rb') as f:
        files = {'file': f}
        data = {
            'apikey': API_KEY,
            # 'language': languages,
            'isOverlayRequired': False,
        }
        resp = requests.post(API_URL, files=files, data=data)
    resp.raise_for_status()
    result = resp.json()

    if result.get('IsErroredOnProcessing'):
        err = result.get('ErrorMessage') or result.get('ErrorDetails')
        raise RuntimeError(f"OCR processing error: {err}")

    text = []
    for parsed in result.get('ParsedResults', []):
        text.append(parsed.get('ParsedText', ''))
    return '\n'.join(text)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python ocr_tool.py <path_to_image_or_pdf>")
        sys.exit(1)

    path = sys.argv[1]
    try:
        print(ocr_file(path))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
