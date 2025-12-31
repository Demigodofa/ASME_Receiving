{ pkgs, ... }: {
  channel = "stable-23.11";

  packages = [
    pkgs.python3
    pkgs.ripgrep
    pkgs.nodejs_20
  ];

  idx.previews = {
    enable = true;
    previews = {
      web = {
        manager = "web";
        command = [
          "python3"
          "-m"
          "http.server"
          "$PORT"
          "--bind"
          "0.0.0.0"
        ];
      };
    };
  };
}
