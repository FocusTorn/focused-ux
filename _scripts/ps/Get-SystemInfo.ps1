# ===================================================================
# System and Monitor Information Report (v2 - Improved RAM detection)
# ===================================================================

# Set console colors for better readability
$titleColor = "Cyan"
$headerColor = "Yellow"
$normalColor = "White"

# --- Main Title ---
Write-Host "=============================================" -ForegroundColor $titleColor
Write-Host "   System and Monitor Information Report" -ForegroundColor $titleColor
Write-Host "=============================================" -ForegroundColor $titleColor
Write-Host "Generated on: $(Get-Date)"
Write-Host


# --- 1. General System & Operating System Information ---
Write-Host "--- 1. General System & OS Information ---" -ForegroundColor $headerColor
$computerInfo = Get-ComputerInfo
[PSCustomObject]@{
    ComputerName       = $env:COMPUTERNAME
    CurrentUser        = $env:USERNAME
    OS_Name            = $computerInfo.OsName
    OS_Version         = $computerInfo.OsVersion
    OS_Architecture    = $computerInfo.OsArchitecture
    Windows_Directory  = $computerInfo.WindowsDirectory
    System_Manufacturer= $computerInfo.CsManufacturer
    System_Model       = $computerInfo.CsModel
    System_Type        = $computerInfo.CsSystemType
} | Format-List
Write-Host


# --- 2. CPU and Motherboard Information ---
Write-Host "--- 2. CPU, Motherboard & BIOS Information ---" -ForegroundColor $headerColor
Write-Host "CPU Details:" -ForegroundColor $headerColor
Get-CimInstance -ClassName Win32_Processor | Select-Object -Property Name, Manufacturer, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed | Format-List
Write-Host "Motherboard Details:" -ForegroundColor $headerColor
Get-CimInstance -ClassName Win32_BaseBoard | Select-Object -Property Manufacturer, Product, SerialNumber | Format-List
Write-Host "BIOS Details:" -ForegroundColor $headerColor
Get-CimInstance -ClassName Win32_BIOS | Select-Object -Property Manufacturer, Version, SMBIOSBIOSVersion | Format-List
Write-Host


# --- 3. Memory (RAM) Information (IMPROVED) ---
Write-Host "--- 3. Memory (RAM) Information ---" -ForegroundColor $headerColor

# Get all physical memory sticks first, as this is the most reliable source.
$memorySticks = Get-CimInstance -ClassName Win32_PhysicalMemory

# Calculate the total RAM by summing the capacity of each stick.
# This avoids issues where Get-ComputerInfo reports 0.
$totalRamBytes = ($memorySticks | Measure-Object -Property Capacity -Sum).Sum
$totalRamGB = $totalRamBytes / 1GB

# Get available RAM from the OS.
$freeRamGB = (Get-CimInstance -ClassName Win32_OperatingSystem).FreePhysicalMemory / 1MB # FreePhysicalMemory is in KB, so /1MB converts to GB

Write-Host ("Total Installed RAM (Calculated from sticks): {0:N2} GB" -f $totalRamGB)
Write-Host ("Available RAM (Currently free): {0:N2} GB" -f $freeRamGB)
Write-Host

Write-Host "Individual RAM Stick Details:" -ForegroundColor $headerColor
# Display the details of the sticks we already retrieved.
$memorySticks | Format-Table -Property DeviceLocator, Manufacturer, PartNumber, @{Name="Capacity(GB)";Expression={$_.Capacity/1GB}}, Speed -AutoSize
Write-Host


# --- 4. Graphics Card (GPU) Information ---
Write-Host "--- 4. Graphics Card (GPU) Information ---" -ForegroundColor $headerColor
Get-CimInstance -ClassName Win32_VideoController | Select-Object -Property Name, AdapterRAM, DriverVersion, VideoModeDescription | Format-List
Write-Host


# --- 5. Storage Information ---
Write-Host "--- 5. Storage Information ---" -ForegroundColor $headerColor
Write-Host "Physical Disk Drives:" -ForegroundColor $headerColor
Get-CimInstance -ClassName Win32_DiskDrive | Format-Table -Property Model, @{Name="Size(GB)";Expression={"{0:N2}" -f ($_.Size/1GB)}}, InterfaceType, Partitions -AutoSize
Write-Host "Logical Disks (Partitions):" -ForegroundColor $headerColor
Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 } | Format-Table -Property DeviceID, VolumeName, @{Name="Size(GB)";Expression={"{0:N2}" -f ($_.Size/1GB)}}, @{Name="FreeSpace(GB)";Expression={"{0:N2}" -f ($_.FreeSpace/1GB)}} -AutoSize
Write-Host


# --- 6. Network Information ---
Write-Host "--- 6. Network Information ---" -ForegroundColor $headerColor
Write-Host "Active Network Adapters:" -ForegroundColor $headerColor
Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration -Filter "IPEnabled='TRUE'" | Format-Table -Property Description, @{Name="IPAddress";Expression={$_.IPAddress[0]}}, MACAddress, DefaultIPGateway -AutoSize
Write-Host


# --- 7. Monitor Information ---
Write-Host "--- 7. Monitor Information ---" -ForegroundColor $headerColor
$monitors = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction SilentlyContinue
if ($monitors) {
    Write-Host "Found $($monitors.Count) connected monitor(s)."
    $monitorCounter = 1
    foreach ($monitor in $monitors) {
        $manufacturer = [System.Text.Encoding]::ASCII.GetString($monitor.ManufacturerName).Trim("`0")
        $name = [System.Text.Encoding]::ASCII.GetString($monitor.UserFriendlyName).Trim("`0")
        $serial = [System.Text.Encoding]::ASCII.GetString($monitor.SerialNumberID).Trim("`0")
        $displayParams = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorBasicDisplayParams | Where-Object { $_.InstanceName -eq $monitor.InstanceName }
        Write-Host
        Write-Host "--- Monitor #$($monitorCounter) Details ---" -ForegroundColor "Green"
        [PSCustomObject]@{
            Manufacturer    = $manufacturer
            Model_Name      = $name
            Serial_Number   = $serial
            Manufacture_Year= $monitor.YearOfManufacture
            Active_Status   = $displayParams.Active
            Screen_Width_cm = $displayParams.MaxHorizontalImageSize
            Screen_Height_cm= $displayParams.MaxVerticalImageSize
        } | Format-List
        $monitorCounter++
    }
}
else {
    Write-Host "No active monitors found in WMI. (This can sometimes happen on laptops or with specific display drivers)." -ForegroundColor "Red"
}
Write-Host
Write-Host "=============================================" -ForegroundColor $titleColor
Write-Host "             Report Complete" -ForegroundColor $titleColor
Write-Host "=============================================" -ForegroundColor $titleColor






# # ===================================================================
# # System and Monitor Information Report
# # ===================================================================

# # Set console colors for better readability
# $titleColor = "Cyan"
# $headerColor = "Yellow"
# $normalColor = "White"

# # --- Main Title ---
# Write-Host "=============================================" -ForegroundColor $titleColor
# Write-Host "   System and Monitor Information Report" -ForegroundColor $titleColor
# Write-Host "=============================================" -ForegroundColor $titleColor
# Write-Host "Generated on: $(Get-Date)"
# Write-Host


# # --- 1. General System & Operating System Information ---
# Write-Host "--- 1. General System & OS Information ---" -ForegroundColor $headerColor
# # Get-ComputerInfo is a great all-in-one cmdlet for this
# $computerInfo = Get-ComputerInfo
# [PSCustomObject]@{
#     ComputerName       = $env:COMPUTERNAME
#     CurrentUser        = $env:USERNAME
#     OS_Name            = $computerInfo.OsName
#     OS_Version         = $computerInfo.OsVersion
#     OS_Architecture    = $computerInfo.OsArchitecture
#     Windows_Directory  = $computerInfo.WindowsDirectory
#     System_Manufacturer= $computerInfo.CsManufacturer
#     System_Model       = $computerInfo.CsModel
#     System_Type        = $computerInfo.CsSystemType
# } | Format-List
# Write-Host


# # --- 2. CPU and Motherboard Information ---
# Write-Host "--- 2. CPU, Motherboard & BIOS Information ---" -ForegroundColor $headerColor
# # CPU Info
# Write-Host "CPU Details:" -ForegroundColor $headerColor
# Get-CimInstance -ClassName Win32_Processor | Select-Object -Property Name, Manufacturer, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed | Format-List

# # Motherboard Info
# Write-Host "Motherboard Details:" -ForegroundColor $headerColor
# Get-CimInstance -ClassName Win32_BaseBoard | Select-Object -Property Manufacturer, Product, SerialNumber | Format-List

# # BIOS Info
# Write-Host "BIOS Details:" -ForegroundColor $headerColor
# Get-CimInstance -ClassName Win32_BIOS | Select-Object -Property Manufacturer, Version, SMBIOSBIOSVersion | Format-List
# Write-Host


# # --- 3. Memory (RAM) Information ---
# Write-Host "--- 3. Memory (RAM) Information ---" -ForegroundColor $headerColor
# $totalRam = ($computerInfo.TotalPhysicalMemory / 1GB)
# $freeRam = (Get-CimInstance -ClassName Win32_OperatingSystem).FreePhysicalMemory / 1MB
# Write-Host ("Total Installed RAM: {0:N2} GB" -f $totalRam)
# Write-Host ("Available RAM: {0:N2} GB" -f $freeRam)

# # Details for each RAM stick
# Write-Host "Individual RAM Stick Details:" -ForegroundColor $headerColor
# Get-CimInstance -ClassName Win32_PhysicalMemory | Format-Table -Property DeviceLocator, Manufacturer, PartNumber, @{Name="Capacity(GB)";Expression={$_.Capacity/1GB}}, Speed -AutoSize
# Write-Host


# # --- 4. Graphics Card (GPU) Information ---
# Write-Host "--- 4. Graphics Card (GPU) Information ---" -ForegroundColor $headerColor
# Get-CimInstance -ClassName Win32_VideoController | Select-Object -Property Name, AdapterRAM, DriverVersion, VideoModeDescription | Format-List
# Write-Host


# # --- 5. Storage Information ---
# Write-Host "--- 5. Storage Information ---" -ForegroundColor $headerColor
# # Physical Disks
# Write-Host "Physical Disk Drives:" -ForegroundColor $headerColor
# Get-CimInstance -ClassName Win32_DiskDrive | Format-Table -Property Model, @{Name="Size(GB)";Expression={"{0:N2}" -f ($_.Size/1GB)}}, InterfaceType, Partitions -AutoSize

# # Logical Disks (Partitions)
# Write-Host "Logical Disks (Partitions):" -ForegroundColor $headerColor
# Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 } | Format-Table -Property DeviceID, VolumeName, @{Name="Size(GB)";Expression={"{0:N2}" -f ($_.Size/1GB)}}, @{Name="FreeSpace(GB)";Expression={"{0:N2}" -f ($_.FreeSpace/1GB)}} -AutoSize
# Write-Host


# # --- 6. Network Information ---
# Write-Host "--- 6. Network Information ---" -ForegroundColor $headerColor
# Write-Host "Active Network Adapters:" -ForegroundColor $headerColor
# Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration -Filter "IPEnabled='TRUE'" | Format-Table -Property Description, @{Name="IPAddress";Expression={$_.IPAddress[0]}}, MACAddress, DefaultIPGateway -AutoSize
# Write-Host


# # --- 7. Monitor Information ---
# Write-Host "--- 7. Monitor Information ---" -ForegroundColor $headerColor
# # Query WMI for monitor details. This requires a different namespace.
# $monitors = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction SilentlyContinue

# if ($monitors) {
#     Write-Host "Found $($monitors.Count) connected monitor(s)."
#     $monitorCounter = 1
#     foreach ($monitor in $monitors) {
#         # The data is stored as byte arrays, so we need to decode it
#         $manufacturer = [System.Text.Encoding]::ASCII.GetString($monitor.ManufacturerName).Trim("`0")
#         $name = [System.Text.Encoding]::ASCII.GetString($monitor.UserFriendlyName).Trim("`0")
#         $serial = [System.Text.Encoding]::ASCII.GetString($monitor.SerialNumberID).Trim("`0")
        
#         # Get screen size from a related WMI class
#         $displayParams = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorBasicDisplayParams | Where-Object { $_.InstanceName -eq $monitor.InstanceName }
        
#         Write-Host
#         Write-Host "--- Monitor #$($monitorCounter) Details ---" -ForegroundColor "Green"
        
#         [PSCustomObject]@{
#             Manufacturer    = $manufacturer
#             Model_Name      = $name
#             Serial_Number   = $serial
#             Manufacture_Year= $monitor.YearOfManufacture
#             Active_Status   = $displayParams.Active
#             Screen_Width_cm = $displayParams.MaxHorizontalImageSize
#             Screen_Height_cm= $displayParams.MaxVerticalImageSize
#         } | Format-List
        
#         $monitorCounter++
#     }
# }
# else {
#     Write-Host "No active monitors found in WMI. (This can sometimes happen on laptops or with specific display drivers)." -ForegroundColor "Red"
# }
# Write-Host
# Write-Host "=============================================" -ForegroundColor $titleColor
# Write-Host "             Report Complete" -ForegroundColor $titleColor
# Write-Host "=============================================" -ForegroundColor $titleColor