#!/usr/bin/env pwsh

# System Specs Extractor
# Comprehensive system information gathering script
# Author: AI Assistant
# Date: $(Get-Date -Format "yyyy-MM-dd")

param(
    [switch]$Json,
    [switch]$Csv,
    [string]$OutputFile = "",
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "SilentlyContinue"

# Color functions for output formatting
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-SectionHeader {
    param([string]$Title)
    Write-ColorOutput "`n" + "=" * 60 -Color "Cyan"
    Write-ColorOutput " $Title" -Color "Yellow"
    Write-ColorOutput "=" * 60 -Color "Cyan"
}

function Write-SubHeader {
    param([string]$Title)
    Write-ColorOutput "`n--- $Title ---" -Color "Green"
}

# Initialize results object
$SystemSpecs = @{}

# Get system basic info
function Get-SystemBasicInfo {
    Write-SubHeader "System Basic Information"
    
    $computerSystem = Get-WmiObject -Class Win32_ComputerSystem
    $operatingSystem = Get-WmiObject -Class Win32_OperatingSystem
    $computerSystemProduct = Get-WmiObject -Class Win32_ComputerSystemProduct
    
    $basicInfo = @{
        ComputerName = $computerSystem.Name
        Manufacturer = $computerSystem.Manufacturer
        Model = $computerSystem.Model
        SystemType = $computerSystem.SystemType
        TotalPhysicalMemory = [math]::Round($computerSystem.TotalPhysicalMemory / 1GB, 2)
        Domain = $computerSystem.Domain
        Workgroup = $computerSystem.Workgroup
        BootupState = $computerSystem.BootupState
        PowerSupplyState = $computerSystem.PowerSupplyState
        ThermalState = $computerSystem.ThermalState
        OSName = $operatingSystem.Caption
        OSVersion = $operatingSystem.Version
        OSArchitecture = $operatingSystem.OSArchitecture
        BuildNumber = $operatingSystem.BuildNumber
        SerialNumber = $computerSystemProduct.SerialNumber
        UUID = $computerSystemProduct.UUID
        InstallDate = $operatingSystem.InstallDate
        LastBootUpTime = $operatingSystem.LastBootUpTime
        LocalDateTime = $operatingSystem.LocalDateTime
    }
    
    # Display results
    $basicInfo.GetEnumerator() | Sort-Object Name | ForEach-Object {
        Write-ColorOutput "$($_.Key): $($_.Value)" -Color "White"
    }
    
    $SystemSpecs.BasicInfo = $basicInfo
}

# Get processor information
function Get-ProcessorInfo {
    Write-SubHeader "Processor Information"
    
    $processors = Get-WmiObject -Class Win32_Processor
    $processorInfo = @()
    
    foreach ($processor in $processors) {
        $proc = @{
            Name = $processor.Name
            Manufacturer = $processor.Manufacturer
            Description = $processor.Description
            Family = $processor.Family
            Architecture = $processor.Architecture
            MaxClockSpeed = "$($processor.MaxClockSpeed) MHz"
            NumberOfCores = $processor.NumberOfCores
            NumberOfLogicalProcessors = $processor.NumberOfLogicalProcessors
            ProcessorId = $processor.ProcessorId
            SocketDesignation = $processor.SocketDesignation
            Status = $processor.Status
            L2CacheSize = if ($processor.L2CacheSize) { "$($processor.L2CacheSize) KB" } else { "N/A" }
            L3CacheSize = if ($processor.L3CacheSize) { "$($processor.L3CacheSize) KB" } else { "N/A" }
            LoadPercentage = if ($processor.LoadPercentage) { "$($processor.LoadPercentage)%" } else { "N/A" }
        }
        
        # Display results
        Write-ColorOutput "Processor $($processors.IndexOf($processor) + 1):" -Color "Yellow"
        $proc.GetEnumerator() | Sort-Object Name | ForEach-Object {
            Write-ColorOutput "  $($_.Key): $($_.Value)" -Color "White"
        }
        
        $processorInfo += $proc
    }
    
    $SystemSpecs.Processors = $processorInfo
}

# Get memory information
function Get-MemoryInfo {
    Write-SubHeader "Memory Information"
    
    $physicalMemory = Get-WmiObject -Class Win32_PhysicalMemory
    $memoryArray = Get-WmiObject -Class Win32_PhysicalMemoryArray
    
    $memoryInfo = @{
        TotalSlots = $memoryArray.MemoryDevices
        UsedSlots = $physicalMemory.Count
        TotalCapacity = [math]::Round(($physicalMemory | Measure-Object -Property Capacity -Sum).Sum / 1GB, 2)
        MemoryModules = @()
    }
    
    foreach ($memory in $physicalMemory) {
        $mem = @{
            BankLabel = $memory.BankLabel
            Capacity = [math]::Round($memory.Capacity / 1GB, 2)
            Speed = "$($memory.Speed) MHz"
            Manufacturer = $memory.Manufacturer
            PartNumber = $memory.PartNumber
            SerialNumber = $memory.SerialNumber
            FormFactor = $memory.FormFactor
            MemoryType = $memory.MemoryType
            ConfiguredClockSpeed = "$($memory.ConfiguredClockSpeed) MHz"
            ConfiguredVoltage = "$($memory.ConfiguredVoltage / 1000) V"
            DeviceLocator = $memory.DeviceLocator
            Status = $memory.Status
        }
        
        Write-ColorOutput "Memory Module $($physicalMemory.IndexOf($memory) + 1):" -Color "Yellow"
        $mem.GetEnumerator() | Sort-Object Name | ForEach-Object {
            Write-ColorOutput "  $($_.Key): $($_.Value)" -Color "White"
        }
        
        $memoryInfo.MemoryModules += $mem
    }
    
    $SystemSpecs.Memory = $memoryInfo
}

# Get storage information
function Get-StorageInfo {
    Write-SubHeader "Storage Information"
    
    $disks = Get-WmiObject -Class Win32_DiskDrive
    $logicalDisks = Get-WmiObject -Class Win32_LogicalDisk
    $diskPartitions = Get-WmiObject -Class Win32_DiskPartition
    
    $storageInfo = @{
        PhysicalDisks = @()
        LogicalDisks = @()
    }
    
    # Physical disks
    foreach ($disk in $disks) {
        $diskInfo = @{
            Model = $disk.Model
            Manufacturer = $disk.Manufacturer
            Size = [math]::Round($disk.Size / 1GB, 2)
            InterfaceType = $disk.InterfaceType
            MediaType = $disk.MediaType
            SerialNumber = $disk.SerialNumber
            FirmwareRevision = $disk.FirmwareRevision
            Partitions = $disk.Partitions
            Status = $disk.Status
            DeviceID = $disk.DeviceID
        }
        
        Write-ColorOutput "Physical Disk $($disks.IndexOf($disk) + 1):" -Color "Yellow"
        $diskInfo.GetEnumerator() | Sort-Object Name | ForEach-Object {
            Write-ColorOutput "  $($_.Key): $($_.Value)" -Color "White"
        }
        
        $storageInfo.PhysicalDisks += $diskInfo
    }
    
    # Logical disks
    foreach ($logicalDisk in $logicalDisks) {
        $logicalInfo = @{
            DeviceID = $logicalDisk.DeviceID
            VolumeName = $logicalDisk.VolumeName
            FileSystem = $logicalDisk.FileSystem
            Size = [math]::Round($logicalDisk.Size / 1GB, 2)
            FreeSpace = [math]::Round($logicalDisk.FreeSpace / 1GB, 2)
            UsedSpace = [math]::Round(($logicalDisk.Size - $logicalDisk.FreeSpace) / 1GB, 2)
            PercentFree = [math]::Round(($logicalDisk.FreeSpace / $logicalDisk.Size) * 100, 2)
        }
        
        Write-ColorOutput "Logical Disk $($logicalDisks.IndexOf($logicalDisk) + 1):" -Color "Yellow"
        $logicalInfo.GetEnumerator() | Sort-Object Name | ForEach-Object {
            Write-ColorOutput "  $($_.Key): $($_.Value)" -Color "White"
        }
        
        $storageInfo.LogicalDisks += $logicalInfo
    }
    
    $SystemSpecs.Storage = $storageInfo
}

# Get graphics information
function Get-GraphicsInfo {
    Write-SubHeader "Graphics Information"
    
    $videoControllers = Get-WmiObject -Class Win32_VideoController
    $graphicsInfo = @()
    
    foreach ($video in $videoControllers) {
        $videoInfo = @{
            Name = $video.Name
            Description = $video.Description
            AdapterRAM = if ($video.AdapterRAM -and $video.AdapterRAM -gt 0) { [math]::Round($video.AdapterRAM / 1MB, 2) } else { "N/A" }
            DriverVersion = $video.DriverVersion
            DriverDate = $video.DriverDate
            VideoModeDescription = $video.VideoModeDescription
            VideoProcessor = $video.VideoProcessor
            VideoArchitecture = $video.VideoArchitecture
            VideoMemoryType = $video.VideoMemoryType
            Status = $video.Status
            PNPDeviceID = $video.PNPDeviceID
            Availability = $video.Availability
        }
        
        Write-ColorOutput "Graphics Card $($videoControllers.IndexOf($video) + 1):" -Color "Yellow"
        $videoInfo.GetEnumerator() | Sort-Object Name | ForEach-Object {
            Write-ColorOutput "  $($_.Key): $($_.Value)" -Color "White"
        }
        
        $graphicsInfo += $videoInfo
    }
    
    $SystemSpecs.Graphics = $graphicsInfo
}

# Get network information
function Get-NetworkInfo {
    Write-SubHeader "Network Information"
    
    $networkAdapters = Get-WmiObject -Class Win32_NetworkAdapter | Where-Object { $_.NetConnectionStatus -eq 2 }
    $networkInfo = @{
        Adapters = @()
        IPConfiguration = @()
    }
    
    foreach ($adapter in $networkAdapters) {
        $adapterInfo = @{
            Name = $adapter.Name
            Description = $adapter.Description
            Manufacturer = $adapter.Manufacturer
            MACAddress = $adapter.MACAddress
            Speed = if ($adapter.Speed) { "$($adapter.Speed / 1000000) Mbps" } else { "N/A" }
            Status = $adapter.Status
            NetConnectionStatus = $adapter.NetConnectionStatus
            PNPDeviceID = $adapter.PNPDeviceID
        }
        
        Write-ColorOutput "Network Adapter $($networkAdapters.IndexOf($adapter) + 1):" -Color "Yellow"
        $adapterInfo.GetEnumerator() | Sort-Object Name | ForEach-Object {
            Write-ColorOutput "  $($_.Key): $($_.Value)" -Color "White"
        }
        
        $networkInfo.Adapters += $adapterInfo
    }
    
    # Get IP configuration
    try {
        $ipConfig = Get-NetIPConfiguration | Where-Object { $_.NetAdapter.Status -eq "Up" }
        foreach ($config in $ipConfig) {
            $ipInfo = @{
                InterfaceAlias = $config.InterfaceAlias
                IPv4Address = $config.IPv4Address.IPAddress
                IPv6Address = $config.IPv6Address.IPAddress
                SubnetMask = $config.IPv4Address.PrefixLength
                DefaultGateway = $config.IPv4DefaultGateway.NextHop
                DNSServer = ($config.DNSServer.ServerAddresses -join ", ")
            }
            
            Write-ColorOutput "IP Configuration $($ipConfig.IndexOf($config) + 1):" -Color "Yellow"
            $ipInfo.GetEnumerator() | Sort-Object Name | ForEach-Object {
                Write-ColorOutput "  $($_.Key): $($_.Value)" -Color "White"
            }
            
            $networkInfo.IPConfiguration += $ipInfo
        }
    }
    catch {
        Write-ColorOutput "  IP Configuration: Unable to retrieve" -Color "Red"
    }
    
    $SystemSpecs.Network = $networkInfo
}

# Get motherboard information
function Get-MotherboardInfo {
    Write-SubHeader "Motherboard Information"
    
    $baseboard = Get-WmiObject -Class Win32_BaseBoard
    $motherboardInfo = @{
        Manufacturer = $baseboard.Manufacturer
        Product = $baseboard.Product
        Version = $baseboard.Version
        SerialNumber = $baseboard.SerialNumber
        Tag = $baseboard.Tag
        ConfigOptions = $baseboard.ConfigOptions
        LocationInChassis = $baseboard.LocationInChassis
        PoweredOn = $baseboard.PoweredOn
        Status = $baseboard.Status
    }
    
    $motherboardInfo.GetEnumerator() | Sort-Object Name | ForEach-Object {
        Write-ColorOutput "$($_.Key): $($_.Value)" -Color "White"
    }
    
    $SystemSpecs.Motherboard = $motherboardInfo
}

# Get BIOS information
function Get-BIOSInfo {
    Write-SubHeader "BIOS Information"
    
    $bios = Get-WmiObject -Class Win32_BIOS
    $biosInfo = @{
        Manufacturer = $bios.Manufacturer
        SMBIOSBIOSVersion = $bios.SMBIOSBIOSVersion
        SMBIOSMajorVersion = $bios.SMBIOSMajorVersion
        SMBIOSMinorVersion = $bios.SMBIOSMinorVersion
        SerialNumber = $bios.SerialNumber
        Version = $bios.Version
        ReleaseDate = $bios.ReleaseDate
        SMBIOSPresent = $bios.SMBIOSPresent
        Status = $bios.Status
    }
    
    $biosInfo.GetEnumerator() | Sort-Object Name | ForEach-Object {
        Write-ColorOutput "$($_.Key): $($_.Value)" -Color "White"
    }
    
    $SystemSpecs.BIOS = $biosInfo
}

# Get installed software
function Get-InstalledSoftware {
    Write-SubHeader "Installed Software (Top 20)"
    
    try {
        $software = Get-WmiObject -Class Win32_Product | 
                   Where-Object { $_.Name -ne $null } | 
                   Sort-Object Name | 
                   Select-Object -First 20
        
        $softwareInfo = @()
        
        foreach ($app in $software) {
            $appInfo = @{
                Name = $app.Name
                Version = $app.Version
                Vendor = $app.Vendor
                InstallDate = $app.InstallDate
                InstallLocation = $app.InstallLocation
            }
            
            Write-ColorOutput "$($app.Name) - $($app.Version)" -Color "White"
            $softwareInfo += $appInfo
        }
        
        $SystemSpecs.InstalledSoftware = $softwareInfo
    }
    catch {
        Write-ColorOutput "Unable to retrieve installed software list" -Color "Red"
    }
}

# Get environment information
function Get-EnvironmentInfo {
    Write-SubHeader "Environment Information"
    
    $environmentInfo = @{
        PowerShellVersion = $PSVersionTable.PSVersion.ToString()
        PowerShellEdition = $PSVersionTable.PSEdition
        PowerShellBuildVersion = $PSVersionTable.BuildVersion.ToString()
        CLRVersion = $PSVersionTable.CLRVersion.ToString()
        WSManStackVersion = $PSVersionTable.WSManStackVersion.ToString()
        PSCompatibleVersions = $PSVersionTable.PSCompatibleVersions -join ", "
        PSSemanticVersion = $PSVersionTable.PSSemanticVersion.ToString()
        PSRemotingProtocolVersion = $PSVersionTable.PSRemotingProtocolVersion.ToString()
        CurrentUser = $env:USERNAME
        ComputerName = $env:COMPUTERNAME
        UserDomain = $env:USERDOMAIN
        TempPath = $env:TEMP
        SystemRoot = $env:SystemRoot
        ProgramFiles = $env:ProgramFiles
        ProgramFilesX86 = ${env:ProgramFiles(x86)}
        Path = $env:PATH
    }
    
    $environmentInfo.GetEnumerator() | Sort-Object Name | ForEach-Object {
        if ($_.Key -eq "Path") {
            Write-ColorOutput "$($_.Key): [Multiple paths - see detailed output]" -Color "White"
        } else {
            Write-ColorOutput "$($_.Key): $($_.Value)" -Color "White"
        }
    }
    
    $SystemSpecs.Environment = $environmentInfo
}

# Get performance information
function Get-PerformanceInfo {
    Write-SubHeader "Performance Information"
    
    try {
        $cpu = Get-WmiObject -Class Win32_Processor
        $memory = Get-WmiObject -Class Win32_OperatingSystem
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3"
        
        $performanceInfo = @{
            CPULoadPercentage = if ($cpu.LoadPercentage) { "$($cpu.LoadPercentage)%" } else { "N/A" }
            TotalPhysicalMemory = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
            AvailablePhysicalMemory = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
            TotalVirtualMemory = [math]::Round($memory.TotalVirtualMemorySize / 1MB, 2)
            AvailableVirtualMemory = [math]::Round($memory.FreeVirtualMemory / 1MB, 2)
            PageFileSize = [math]::Round($memory.SizeStoredInPagingFiles / 1MB, 2)
            Uptime = [math]::Round((Get-Date) - [System.Management.ManagementDateTimeConverter]::ToDateTime($memory.LastBootUpTime))
            ProcessCount = (Get-Process).Count
            ThreadCount = (Get-Process | Measure-Object -Property Threads -Sum).Sum
        }
        
        $performanceInfo.GetEnumerator() | Sort-Object Name | ForEach-Object {
            Write-ColorOutput "$($_.Key): $($_.Value)" -Color "White"
        }
        
        $SystemSpecs.Performance = $performanceInfo
    }
    catch {
        Write-ColorOutput "Unable to retrieve performance information" -Color "Red"
    }
}

# Add timestamp to results
$SystemSpecs.Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$SystemSpecs.GeneratedBy = "System Specs Extractor Script"

# Main execution
Write-ColorOutput "System Specifications Extractor" -Color "Cyan"
Write-ColorOutput "Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Color "Gray"

# Execute all information gathering functions
Get-SystemBasicInfo
Get-ProcessorInfo
Get-MemoryInfo
Get-StorageInfo
Get-GraphicsInfo
Get-NetworkInfo
Get-MotherboardInfo
Get-BIOSInfo
Get-InstalledSoftware
Get-EnvironmentInfo
Get-PerformanceInfo

# Output results
if ($Json) {
    Write-SectionHeader "JSON Output"
    $jsonOutput = $SystemSpecs | ConvertTo-Json -Depth 10
    Write-Output $jsonOutput
    
    if ($OutputFile) {
        $jsonOutput | Out-File -FilePath $OutputFile -Encoding UTF8
        Write-ColorOutput "`nJSON output saved to: $OutputFile" -Color "Green"
    }
}

if ($Csv) {
    Write-SectionHeader "CSV Output"
    $csvData = @()
    
    # Flatten the nested structure for CSV
    $SystemSpecs.GetEnumerator() | ForEach-Object {
        if ($_.Value -is [hashtable] -or $_.Value -is [array]) {
            $_.Value | ForEach-Object {
                if ($_ -is [hashtable]) {
                    $_.GetEnumerator() | ForEach-Object {
                        $csvData += [PSCustomObject]@{
                            Category = $_.Key
                            Property = $_.Key
                            Value = $_.Value
                        }
                    }
                }
            }
        } else {
            $csvData += [PSCustomObject]@{
                Category = "General"
                Property = $_.Key
                Value = $_.Value
            }
        }
    }
    
    $csvOutput = $csvData | ConvertTo-Csv -NoTypeInformation
    Write-Output $csvOutput
    
    if ($OutputFile) {
        $csvOutput | Out-File -FilePath $OutputFile -Encoding UTF8
        Write-ColorOutput "`nCSV output saved to: $OutputFile" -Color "Green"
    }
}

if ($OutputFile -and !$Json -and !$Csv) {
    # Save as text file
    $SystemSpecs | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-ColorOutput "`nOutput saved to: $OutputFile" -Color "Green"
}

Write-ColorOutput "`nSystem specifications extraction completed!" -Color "Green"
