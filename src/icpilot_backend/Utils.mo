import Nat8 "mo:base/Nat8";
import Text "mo:base/Text";
import Time "mo:base/Time";

module {
    // Convert byte array to hexadecimal string
    public func toHex(array : [Nat8]) : Text {
        let hexChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        var result = "";
        for (byte in array.vals()) {
            let highNibble = Nat8.toNat(byte / 16);
            let lowNibble = Nat8.toNat(byte % 16);
            result := result # hexChars[highNibble] # hexChars[lowNibble];
        };
        return result;
    };

    // Get current timestamp
    public func getCurrentTimestamp() : Int {
        return Time.now();
    };
};
