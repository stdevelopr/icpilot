import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Time "mo:base/Time";
import Types "Types";

module {
  public class FileManager() {
    private func getFileNameFromPath(path : Text) : Text {
      let parts = Text.split(path, #char '/');
      let parts_array = Iter.toArray(parts);
      if (parts_array.size() > 0) {
        parts_array[parts_array.size() - 1];
      } else {
        path;
      };
    };
    private let fileMetadataStorage = HashMap.HashMap<Text, Types.FileMetadata>(50, Text.equal, Text.hash);
    private let fileContentStorage = HashMap.HashMap<Text, Types.FileContent>(50, Text.equal, Text.hash);
    private var fileMetadataEntries : Types.FileMetadataStorage = [];
    private var fileContentEntries : Types.FileContentStorage = [];

    public func preupgrade() : (Types.FileMetadataStorage, Types.FileContentStorage) {
      fileMetadataEntries := Iter.toArray(fileMetadataStorage.entries());
      fileContentEntries := Iter.toArray(fileContentStorage.entries());
      return (fileMetadataEntries, fileContentEntries);
    };

    public func postupgrade(storedMetadata : Types.FileMetadataStorage, storedContent : Types.FileContentStorage) {
      fileMetadataEntries := storedMetadata;
      fileContentEntries := storedContent;

      for ((fileId, metadata) in fileMetadataEntries.vals()) {
        fileMetadataStorage.put(fileId, metadata);
      };

      for ((fileId, content) in fileContentEntries.vals()) {
        fileContentStorage.put(fileId, content);
      };
    };

    public func uploadFile(caller : Principal, filePath : Text, contentType : Text, content : Types.FileContent) : async Result.Result<Text, Text> {
      try {
        let fileId = Text.concat(Principal.toText(caller), Text.concat("_", filePath));
        let currentTime = Time.now();
        let fileName = getFileNameFromPath(filePath);
        let isDirectory = Blob.toArray(content).size() == 0;

        let fileMetadata : Types.FileMetadata = {
          name = fileName;
          path = filePath;
          contentType = contentType;
          size = Blob.toArray(content).size();
          createdAt = currentTime;
          updatedAt = currentTime;
          owner = caller;
          isDirectory = isDirectory;
        };

        fileMetadataStorage.put(fileId, fileMetadata);
        fileContentStorage.put(fileId, content);

        Debug.print("File uploaded: " # fileId);
        return #ok(fileId);
      } catch (e) {
        Debug.print("Error uploading file");
        return #err("Error uploading file");
      };
    };

    public func getFileMetadata(fileId : Text) : ?Types.FileMetadata {
      fileMetadataStorage.get(fileId);
    };

    public func getFileContent(fileId : Text) : ?Types.FileContent {
      fileContentStorage.get(fileId);
    };

    public func getMyFiles(caller : Principal) : [Types.FileInfo] {
      let allFiles = Iter.toArray(fileMetadataStorage.entries());

      Array.mapFilter<(Text, Types.FileMetadata), Types.FileInfo>(
        allFiles,
        func((id, metadata) : (Text, Types.FileMetadata)) : ?Types.FileInfo {
          if (Principal.equal(metadata.owner, caller)) {
            ?{ id = id; metadata = metadata };
          } else {
            null;
          };
        },
      );
    };

    public func getFilesInDirectory(caller : Principal, dirPath : Text) : [Types.FileInfo] {
      let allFiles = Iter.toArray(fileMetadataStorage.entries());
      let normalizedDirPath = if (Text.endsWith(dirPath, #char '/')) { dirPath } else {
        Text.concat(dirPath, "/");
      };

      Array.mapFilter<(Text, Types.FileMetadata), Types.FileInfo>(
        allFiles,
        func((id, metadata) : (Text, Types.FileMetadata)) : ?Types.FileInfo {
          if (
            Principal.equal(metadata.owner, caller) and
            (Text.startsWith(metadata.path, #text normalizedDirPath) or metadata.path == Text.trimEnd(normalizedDirPath, #char '/'))
          ) {
            ?{ id = id; metadata = metadata };
          } else {
            null;
          };
        },
      );
    };

    public func getAllFiles() : [Types.FileInfo] {
      let allFiles = Iter.toArray(fileMetadataStorage.entries());

      Array.map<(Text, Types.FileMetadata), Types.FileInfo>(
        allFiles,
        func((id, metadata) : (Text, Types.FileMetadata)) : Types.FileInfo {
          { id = id; metadata = metadata };
        },
      );
    };

    public func deleteFile(caller : Principal, fileId : Text) : Result.Result<(), Text> {
      switch (fileMetadataStorage.get(fileId)) {
        case (null) {
          return #err("File not found");
        };
        case (?metadata) {
          if (Principal.equal(metadata.owner, caller)) {
            fileMetadataStorage.delete(fileId);
            fileContentStorage.delete(fileId);
            return #ok();
          } else {
            return #err("Not authorized to delete this file");
          };
        };
      };
    };
  };
};
