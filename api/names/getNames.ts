import {google} from 'googleapis';
import {GoogleAuth} from 'google-auth-library';

export class RetrieveNames {
    /**
     * Retrieves names from National Memorialization Spreadsheet
     * via Google Sheet API
     * (Might want to set the spreadsheet ID as an environment variable)
     * (Might want to function to get first and last names columns based on Row 1 of Spreadsheet)
     */

    private names: String[][];
    private onReadyCallback?: () => void;
    public dataComplete: boolean = false;

    constructor(onReadyCallback?: () => void) {
        //Construct the class
        this.onReadyCallback = onReadyCallback;
        this.names = [];
        this.run();
    }

    private async run(): Promise<void> {
        const first_name_col: String = "T";
        const last_name_col: String = "U";
        const sheet_promise: Promise<any> = await this.get_sheetsAPI_connection();
        const promised_data: String[][][] = await this.get_data(sheet_promise, first_name_col, last_name_col);
        this.names = this.process_data(promised_data);
        this.onReadyCallback?.();
    }

    /**
     * Connects to Google Sheet API
     * Relies on GOOGLE_APPLICATION_CREDENTIALS environment variable
     * that points to a service account key file
     * @returns {Promise<any>} - Google Sheets API connection Sheet object (Promise)
     * @private
     */
    private async get_sheetsAPI_connection(): Promise<any> {
        let auth: GoogleAuth;
        try {
            auth = new GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
            })
        } catch (err) {
            console.log(err);
            throw new Error("Unable to retrieve database connection");
        }

        let authClient: any;
        try {
            authClient = await auth.getClient();
        } catch (err) {
            console.log(err);
            throw new Error("Unable to get google sheet auth client");
        }
        let sheetConn: any;
        try {
            sheetConn = google.sheets({version: 'v4', auth: authClient});
        } catch (err) {
            console.log(err);
            throw new Error("Unable to get sheets connection");
        }
        //console.log(typeof sheetConn);

        return sheetConn;
    };

    /**
     * Retrieves First and Last names from National Memorialization Spreadsheet
     * @param {Promise<any>} sheet_promise - Google Sheets API connection Sheet object (Promise)
     * @param {String} first_name_col - Column letter of first names
     * @param {String} last_name_col - Column letter of last names
     * @returns {Promise<String[][][]>} - Array of arrays, of strings containing first and last names
     * @private
     */
    private async get_data(sheet_promise: Promise<any>, first_name_col: String, last_name_col: String): Promise<String[][][]> {
        let sheet: any;
        /*sheet_promise.then(data => {
            sheet = data;
        }).catch(err => {
            console.log(err);
        });*/
        sheet = sheet_promise;
        //console.log(typeof sheet);
        //TEMP - set spreadsheet ID to environment variable
        const spreadsheet_id = "1h_9q8N5W0m-Xs3khm9aBdVNqnHf-TZ0KzJQarkxRhEg";

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

        return [firstName_res.data.values, lastName_res.data.values];
    }

    /**
     * Processes data retrieved from Google Sheets API
     * @param {Promise<String[][][]>} promised_data - Array of arrays, of strings containing first and last names
     * @returns {String[][]} - Array of arrays, of strings containing first and last names
     * @private
     */
    private process_data(promised_data: String[][][]): String[][] {
        let raw_names: String[][][];
        const names: String[][] = [];
        /*promised_data.then(data => {
            raw_names = data;
        }).catch(err => {
            console.log(err);
            //handle error
        });*/
        raw_names = promised_data;
        //loop through raw_names and push to names array (while cleaning up data)
        const firstName_len: number = raw_names[0].length;
        const lastName_len: number = raw_names[1].length;
        const min_len: number = Math.min(firstName_len, lastName_len);
        const nameSet = new Set();
        for (let i: number = 0; i < min_len; i++) {
            let firstName: String = raw_names[0][i][0];
            let lastName: String = raw_names[1][i][0];
            if (this.check_name(firstName, lastName)) {
                const fullName: String = `${firstName} ${lastName}`;
                if (!nameSet.has(fullName)) {
                    nameSet.add(fullName);
                    names.push([firstName, lastName]);
                }
            }
        }

        return names;
    }

    /**
     * Checks if name is valid (not empty)
     * Checks names against regex of invalid patterns
     * @param {String} firstName
     * @param {String} lastName
     * @returns {boolean} - true if name is valid, false if not
     * @private
     */
    private check_name(firstName: String, lastName: String): boolean {
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

    /**
     * Returns an array of strings containing first and last names
     * @returns {String[]} - Array of strings containing first and last names
     */
    public getNames(): String[] {
        const namesArray: String[] = new Array<String>();
        for (let i = 1; i < this.names.length; i += 1) {
            let nameStr = `${this.names[i][0]} ${this.names[i][1]}`;
            namesArray.push(nameStr);
        }
        return namesArray;
    }

    /**
     * Creates a set to filter any duplicates
     * @returns {String[]} - Returns array of name strings
     */
    public getNamesSet(): String[] {
        const namesSet = new Set();
        this.names.forEach((name) => {
            let nameStr = `${name[0]} ${name[1]}`
            namesSet.add(nameStr);
        })
        const names: String[] = [];
        namesSet.forEach((name: any) => {
            names.push(name.toString().toLowerCase());
        })
        return names;
    }
}