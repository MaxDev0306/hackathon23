import {INIT, RESULT, ROUND} from './Interfaces';
import {io} from "socket.io-client";
import {logic, whoAmI} from "./logic";

const SECRET = '7a20fc79-f37c-4240-b9e5-de6117a82315';
const socket = io('https://games.uhno.de', {            // Server ist "games.uhno.de"
    transports: ['websocket']                             // wichtig: aktuell werden nur Websockets unterstützt
});
let symbol: string = "";

socket.on('connect', () => {
    console.log('connected')
    socket.emit('authenticate', SECRET, (success: boolean) => {    // wenn die Verbindung hergestellt ist, mit dem Secret authentifizieren
        if (success) {
            console.log('authenticated')
        }
    });
});
socket.on('disconnect', () => {
    console.log('disconnected')
});

// Your Logic is callback
socket.on('data', (data, callback) => {
    switch (data.type) {
        case 'INIT':
            init(data);
            return;
        case 'RESULT':
            result(data);
            return;
        case 'ROUND':
            round(data, callback);
    }
});
const init = (data: INIT) => {
    symbol = whoAmI(data);
};
const result = (data: RESULT) => {
    console.log(data.log);
    console.log(data.self);

};
const round = (data: ROUND, callback: (turn: [cord1: number, cord2: number]) => void) => {
    symbol = whoAmI(data);
    const enemySymbol = symbol === "X" ? "O" : "X";
    if (data.forcedSection === null) {
        const emptyFields: number[] = data.overview.reduce((fields: number[], value: string, index: number) => {
            if (value === '') {
                fields.push(index);
            }
            return fields;
        }, []);
        callback([emptyFields[0], logic(data.board,data.overview, emptyFields[0], enemySymbol, symbol)])
    } else {
        if (data.overview[data.forcedSection] !== '') {
            const emptyFields: number[] = data.overview.reduce((fields: number[], value: string, index: number) => {
                if (value === '') {
                    fields.push(index);
                }
                return fields;
            }, []);
            callback([emptyFields[0], logic(data.board,data.overview, data.forcedSection, enemySymbol, symbol)]);
        }
        callback([data.forcedSection, logic(data.board,data.overview, data.forcedSection, enemySymbol, symbol)]);
    }
}