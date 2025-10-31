import {JWT} from "google-auth-library";
import {google} from "googleapis";

async function getRowValue(sheet: any, sheet_id: String): Promise<String[]> {
    const row1Range = 'Loved Ones to Be Memorialized!1:1';

    const firstNameRow: String = "Your loved one's name to be memorialized: (First Name)";
    const lastNameRow: String = "Your loved one's name to be memorialized: (Last Name)";

    let values: String[];
    try {
        const rows = await sheet.spreadsheets.values.get({
            spreadsheet_id: sheet_id,
            range: row1Range
        })
        values = rows.data.values[0];
    } catch (error) {
        console.error(error);
    }

    const firstNameIndex = values.indexOf(firstNameRow);
    const lastNameIndex = values.indexOf(lastNameRow);

    return [indexToColumnLetter(firstNameIndex), indexToColumnLetter(lastNameIndex)];
}

function indexToColumnLetter(index: number): String {
    let col: String = "";
    let dividend:number = index + 1; // Convert to 1-based for the math
    let remainder: number;

    while (dividend > 0) {
        remainder = (dividend - 1) % 26;
        col = String.fromCharCode(65 + remainder) + col; // 65 is ASCII for 'A'
        dividend = Math.floor((dividend - 1) / 26);
    }
    return col;
}

function check_name(firstName: String, lastName: String): boolean {
    if (firstName === "" || lastName === "") {return false;}
    if (typeof firstName === "undefined" || typeof lastName === "undefined") {return false;}
    //console.log(firstName + ": " + lastName);
    const invalid_patterns: RegExp[] = [
        /A{2,}/
        ///[.,\/#!$%\^&\*;:{}=\-_`~()]/
    ];
    for (let i: number = 0; i < invalid_patterns.length; i++) {
        if (invalid_patterns[i].test(firstName.toString()) || invalid_patterns[i].test(lastName.toString())) {
            return false;
        }
    }
    return true;
}

let googleSheets = async () => {

    const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!credsJson) {
        throw new Error("No credentials provided");
    }

    let creds;
    try {
        creds = JSON.parse(credsJson);
    } catch (error) {
        console.error(error);
        throw new Error("Unable to parse credentials JSON");
    }


    let authClient: any;

    try {
        authClient = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        })
    } catch (error) {
        console.error(error);
        throw new Error("Unable to get auth client using JSON Web Token");
    }


    let sheet: any = google.sheets({version: "v4", auth: authClient});

    const spreadsheet_id = process.env.SPREADSHEET_ID;

    //let first_name_col = "T";
    //let last_name_col = "U";

    const [first_name_col, last_name_col] = await getRowValue(sheet, spreadsheet_id);

    const firstNameRange = `Loved Ones to Be Memorialized!${first_name_col}:${first_name_col}`;
    const lastNameRange = `Loved Ones to Be Memorialized!${last_name_col}:${last_name_col}`;

    const firstName_res = await sheet.spreadsheets.values.get({
        spreadsheetId: spreadsheet_id,
        range: firstNameRange,
    });
    const lastName_res = await sheet.spreadsheets.values.get({
        spreadsheetId: spreadsheet_id,
        range: lastNameRange,
    });

    const first_vals: String[][] = firstName_res.data.values
    const last_vals: String[][] = lastName_res.data.values

    first_vals.shift();
    last_vals.shift();

    return [first_vals, last_vals];
}

export async function get_names(): Promise<String[]> {
    let raw_names: String[][][] = await googleSheets();
    /*googleSheets().then((googleSheets) => {
        raw_names = googleSheets;
    });*/
    const names: String[] = [];

    //loop through raw_names and push to names array (while cleaning up data)
    const firstName_len: number = raw_names[0].length;
    const lastName_len: number = raw_names[1].length;
    const min_len: number = Math.min(firstName_len, lastName_len);
    const nameSet = new Set();
    for (let i: number = 0; i < min_len; i++) {
        let firstName: String = raw_names[0][i][0];
        let lastName: String = raw_names[1][i][0];
        if (check_name(firstName, lastName)) {
            const fullName: String = `${firstName} ${lastName}`;
            if (!nameSet.has(fullName)) {
                nameSet.add(fullName);
                names.push(fullName.toLowerCase());
            }
        }
    }

    return names;
}






