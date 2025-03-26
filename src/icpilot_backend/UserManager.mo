import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Ledger "canister:icp_ledger_canister";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Types "Types";
import CanisterManager "CanisterManager";
import FileManager "FileManager";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Utils "Utils"; // Add this import

class UserManager(canisterManager : CanisterManager.CanisterManager, fileManager : FileManager.FileManager) {

    // Get principal text representation
    func getPrincipalText(userPrincipal : Principal) : Text {
        return Principal.toText(userPrincipal);
    };

    // Get account ID for ICP deposits
    func getAccountId(userPrincipal : Principal) : async Text {
        try {
            let account = {
                owner = userPrincipal;
                subaccount = null;
            };
            let accountIdBlob = await Ledger.account_identifier(account);
            return Utils.toHex(Blob.toArray(accountIdBlob));
        } catch (e) {
            Debug.print("Error getting account ID");
            return "";
        };
    };

    // Function to get the user's balance in e8s format
    func getBalance(userPrincipal : Principal) : async Nat64 {
        try {
            let account = {
                owner = userPrincipal;
                subaccount = null;
            };
            let balance = await Ledger.icrc1_balance_of(account);
            return Nat64.fromNat(balance);
        } catch (e) {
            Debug.print("Error getting user balance");
            return 0;
        };
    };

    // Get user canisters count
    func getCanisterCount(userPrincipal : Principal) : Nat {
        let userCanisters = canisterManager.get_caller_canisters(userPrincipal);
        return userCanisters.size();
    };

    // Get user files count
    func getFilesCount(userPrincipal : Principal) : Nat {
        let userFiles = fileManager.getMyFiles(userPrincipal);
        return userFiles.size();
    };

    // Main function to get comprehensive user information
    public func getUserInfo(userPrincipal : Principal) : async Types.UserInfo {
        try {
            // Get user principal text
            let principalText = getPrincipalText(userPrincipal);
            Debug.print("principalText: " # debug_show (principalText));

            // Get user ICP balance
            let icpBalance = await getBalance(userPrincipal);

            // Get account ID for ICP deposits
            let accountId = await getAccountId(userPrincipal);
            Debug.print("Account ID Text: " # debug_show (accountId));

            // Get user canisters count
            let canisterCount = getCanisterCount(userPrincipal);

            // Get user files count
            let filesCount = getFilesCount(userPrincipal);

            // Current timestamp
            let lastActive = Utils.getCurrentTimestamp();

            return {
                principal = principalText;
                accountId = accountId;
                icpBalance = icpBalance;
                canisterCount = canisterCount;
                filesCount = filesCount;
                lastActive = lastActive;
            };
        } catch (e) {
            Debug.print("Error getting user info");
            return {
                principal = getPrincipalText(userPrincipal);
                accountId = ""; // Add empty account ID in error case
                icpBalance = 0;
                canisterCount = 0;
                filesCount = 0;
                lastActive = Utils.getCurrentTimestamp();
            };
        };
    };
};
