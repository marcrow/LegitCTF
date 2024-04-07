
# Set the configuration file path
$config_file = "flag.conf"
# Path: vm_client/flag.ps1
# Function to retrieve parameters from flag.conf file
function retrieve_parameters {
    if (-not (Test-Path $config_file)) {
        Write-Host "Configuration file not found!"
        exit 1
    }
    $global:ctf_server = Get-Content $config_file | Select-String "CTF_SERVER" | Select-Object -ExpandProperty Line | Where-Object { $_ -notmatch "^#" } | ForEach-Object { $_ -replace ".*=" }
    $global:default_password = Get-Content $config_file | Select-String "DEFAULT_PASSWORD" | Select-Object -ExpandProperty Line | Where-Object { $_ -notmatch "^#" } | ForEach-Object { $_ -replace ".*=" }
    $global:machine_name = Get-Content $config_file | Select-String "MACHINE_NAME" | Select-Object -ExpandProperty Line | Where-Object { $_ -notmatch "^#" } | ForEach-Object { $_ -replace ".*=" }
    $global:ctf_id = Get-Content $config_file | Select-String "CTF_ID" | Select-Object -ExpandProperty Line | Where-Object { $_ -notmatch "^#" } | ForEach-Object { $_ -replace ".*=" }
    $global:instance_id = Get-Content $config_file | Select-String "INSTANCE_ID" | Select-Object -ExpandProperty Line | Where-Object { $_ -notmatch "^#" } | ForEach-Object { $_ -replace ".*=" }
    
}

function Get-AbsolutePath {
    param (
        [Parameter(Mandatory=$true)]
        [string]$RelativePath
    )

    return (Resolve-Path $RelativePath).Path
}

function import_cert {
    $cert_path = Get-AbsolutePath ".\cert.der"
    if (-not (Test-Path $cert_path)) {
        Write-Host "Certificate file not found!"
        exit 1
    }
    #test if the certificate is already installed
    $cert = Get-ChildItem -Path Cert:\LocalMachine\Root | Where-Object { $_.Subject -eq "CN=flag" }
    if ($cert) {
        Write-Host "Certificate already installed!"
        exit 0
    }
    try {
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
        $cert.Import($cert_path)
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store -ArgumentList "Root", "LocalMachine"
        $store.Open("ReadWrite")
        $store.Add($cert)
        $store.Close()
    } catch {
        Write-Host "Error importing certificate: $_"
        exit 1
    }
}


# Function to insert parameters into flag.conf file
function insert_parameters {
    param (
        [string]$parameter_name,
        [string]$parameter_value
    )
    if (Select-String -Pattern "^$parameter_name=" -Path $config_file) {
        (Get-Content $config_file) -replace "^$parameter_name=.*", "$parameter_name=$parameter_value" | Set-Content $config_file
    }
    else {
        Add-Content -Path $config_file -Value "$parameter_name=$parameter_value"
    }
}

# Function to ask for password
function ask_for_password {
    Write-Host "Please enter your password to validate the machine:"
    $password = Read-Host -AsSecureString
    $password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    return $password
}

# Function to save cookie
function save_cookie {
    param (
        [string]$cookie
    )
    if ([string]::IsNullOrEmpty($cookie)) {
        Write-Host "Unknown error - Unable to extract cookie!"
        Write-Host "Response Body: $result"
        exit 6
    }
    $cookie | Out-File -FilePath "./cookie.txt"
}

# Function to retrieve the cookie from the cookie.txt file
function retrieve_cookie {
    $cookie_path = Get-AbsolutePath ".\cookie.txt"
    if (Test-Path $cookie_path) {
        $cookie = Get-Content $cookie_path
	 Write-Host "$cookie"
        return $cookie
    }
    else {
        Write-Host "Cookie file not found!"
        exit 4
    }
}

# Function to extract cookie
function extract_cookie {
    param (
        [string]$result
    )
    $iscookie = $result -split '"' | Select-Object -Index 1
    if ($iscookie -ne "cookie_machine") {
        Write-Host $result
        Write-Host "Cookie extraction failed!"
        exit 7
    }
    $cookie = $result -split '"' | Select-Object -Index 3

    save_cookie -cookie $cookie
}

# Function to perform initial authentication
function first_auth {
    Write-Host "Performing initial authentication..."
    retrieve_parameters
    if ([string]::IsNullOrEmpty($default_password)) {
        Write-Host "Error: Default password cannot be empty!"
        exit 5
    }
    $default_ip = (Get-NetIPAddress | Where-Object { $_.InterfaceAlias -eq "Ethernet" -and $_.AddressFamily -eq "IPv4" }).IPAddress
    Write-Host "Default IP: $default_ip"
    $body = @{
        ctf_id = $ctf_id
        machine_name = $machine_name
        ip = $default_ip
        default_password = $default_password
    } | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "$ctf_server/machines/firstAuth" -Method Post -Body $body -ContentType "application/json"
    if ($result -match "Error") {
        Write-Host $result
        exit 2
    }
    $test_result = $result.new_cookie
    if ($test_result -eq $null) {
        Write-Host "Error: $result"
        exit 2
    }
    $cookie = $result.new_cookie
    $instance = $result.instance
    Write-Host "Cookie: $cookie"
    Write-Host "Instance: $instance"
    if ([string]::IsNullOrEmpty($cookie)) {
        Write-Host "Unknown error during initial authentication! No cookie found"
        Write-Host "Response Body: $result"
        exit 2
    }
    insert_parameters -parameter_name "INSTANCE_ID" -parameter_value $instance
    $cookie | Out-File -FilePath "./cookie.txt"
    Write-Host "Response Body: $result"
}

# Function to exploit the system
function pwned {
    retrieve_parameters
    $cookieValue = retrieve_cookie
    $password=ask_for_password
    if ([string]::IsNullOrEmpty($password)) {
        Write-Host "Password cannot be empty!"
        exit 5
    }
    $body = @{
        ctf_id = $ctf_id
        instance_id = $instance_id
        machine_name = $machine_name
        password = $password
    } | ConvertTo-Json
    
    $cookieContainer = New-Object System.Net.CookieContainer
    $uri = New-Object System.Uri($ctf_server)
    $cookie = New-Object System.Net.Cookie("Cookie_machine", $cookieValue, "/", $uri.Host)
    $cookieContainer.Add($cookie)

    $result = Invoke-WebRequest -Uri "$ctf_server/machines/pwn" -Method Post -Body $body -ContentType "application/json" -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession -Property @{Cookies = $cookieContainer}) -UseBasicParsing
    
    if ($result -match "Error") {
        Write-Host $result
        exit 3
    }
    if ($result.StatusCode -ne 200) {
        Write-Host "Error: Invoke-RestMethod request failed"
        exit 3
    }
    Write-Host "Response Body: $result"
    extract_cookie -result $result
}

# Function to logout
function logout {
    retrieve_parameters
    $cookieValue = retrieve_cookie
    Write-Host "Cookie: $cookieValue"
    $body = @{
        ctf_id = $ctf_id
        instance_id = $instance_id
        machine_name = $machine_name
    } | ConvertTo-Json

    $cookieContainer = New-Object System.Net.CookieContainer
    $uri = New-Object System.Uri($ctf_server)
    $cookie = New-Object System.Net.Cookie("Cookie_machine", $cookieValue, "/", $uri.Host)
    $cookieContainer.Add($cookie)

    $result = Invoke-WebRequest -Uri "$ctf_server/machines/logout" -Method Post -Body $body -ContentType "application/json" -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession -Property @{Cookies = $cookieContainer}) -UseBasicParsing
    
    if ($result.Content -match "Error") {
        Write-Host $result.Content
        exit 8
    }
    if ($result.StatusCode -ne 200) {
        Write-Host "Error: Invoke-RestMethod request failed"
        exit 8
    }
    Write-Host "Response Body: $result.Content"
}


import_cert
# Check arguments and execute appropriate function
if ($args[0] -eq "-f" -or $args[0] -eq "--first") {
    first_auth
    exit 0
}
elseif ($args[0] -eq "-p" -or $args[0] -eq "--pwned" -or $args.Count -eq 0) {
    pwned
    exit 0
}
elseif ($args[0] -eq "-l" -or $args[0] -eq "--logout") {
    logout
    exit 0
}
else {
    Write-Host "Invalid argument provided!"
    exit 1
}