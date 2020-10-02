<?php
/* Cherche la partie variable de l'adresse de téléchargement de la page $filter 
dans le doc configJson.txt. Regarde dans upDate.txt si le document est à jour, 
télécharge le json si non. Enregistre le json à l'adresse $jsonPath.
Status : variable égale à 0 par défault (pas de maj à faire), 
à laquelle on ajoute 1 si un fichier est mis à jour avec succès et 10 si la maj échoue. 
Ainsi, et pour jusqu'à 9 fichiers par page (actuellement max = 3), si status >=10, il y a eu un fail, sinon non.
*/
date_default_timezone_set("Europe/London");
include 'configFiles/config.php';
$baseUrl = "https://data.strasbourg.eu/explore/dataset/";
$jsonPath = '../' . $prodPath;
$configPath = 'configFiles/configJson.txt';
$upDatePath = 'stateFiles/upDate.txt';
$countPath = 'stateFiles/counts.txt';
$countDatePath = 'stateFiles/countDate.txt';
$filter = "";
$forceRefresh = false;
$statusText= '';
$path = $prodPath;

if (array_key_exists('page', $_GET)) {
    $filter = $_GET['page'];
}

if (array_key_exists('forcerefresh', $_GET)) {
    $forceRefresh = filter_var($_GET['forcerefresh'], FILTER_VALIDATE_BOOLEAN);
}

$visits = 1;
$lastMonthVisits = 0;
$monthVisits = 1;
$status = 0;
$date = '';

if (!is_file($upDatePath)) {
    file_put_contents($upDatePath, '');
}

$fileConfigJson = fopen($configPath, 'r');
$fileDateDataset = fopen($upDatePath, 'r+');

if ($fileConfigJson && $filter && !$demoMode) {
    while (($line = fgets($fileConfigJson)) !== false) {
        $array = explode('; ', $line);

        if ($filter == $array[0]) {
            $found = false;
            fseek($fileDateDataset, 0);
            while(($row = fgets($fileDateDataset)) !== false) {
                $infos = explode('; ', rtrim($row));

                if ($array[2] == $infos[0]) {
                    $found = true;
                    $lastUpDate = $infos[1];
                    $startLine = ftell($fileDateDataset);
                    $date = $lastUpDate;
                }
            }

            if ($found !== true) {
                $startLine = ftell($fileDateDataset);
                $lastUpDate = 0;
            }
            
            $nextUpDate = strtotime($array[5]);
            $timeNow = time();

            // on ne rajoute rien à $status si pas d'update
            if (($lastUpDate < $nextUpDate) || $forceRefresh) {
                $format = $array[3];
                $endUrl = '/download/?format=' . $format . '&timezone=Europe/Berlin&lang=fr' . $array[4]; 

                $middleUrl = trim($array[2]);
                $apiUrl = $baseUrl . $middleUrl . $endUrl;
                $saveTo = $jsonPath . $middleUrl . '.' . $format;
        
                $status = getAPI($saveTo, $apiUrl, $status);
    
                if ($found !== true && $status < 10) {
                    fseek($fileDateDataset, $startLine);
                    $textToWrite = $array[2] . '; ' . $timeNow . "\n";
                    fputs($fileDateDataset, $textToWrite); 
                    $date = $timeNow;

                } else if ($status < 10) {
                    $startLine = $startLine - strlen($lastUpDate) -1;
                    fseek($fileDateDataset, $startLine);
                    $textToWrite = $timeNow . "\n";
                    fputs($fileDateDataset, $textToWrite); 
                    $date = $timeNow;
                }
            }
        }
    }

    fclose($fileConfigJson);
    fclose($fileDateDataset);

} else {
    $status = 10;
} 

if ($filter && !$forceRefresh &&!$demoMode) {
    if (is_file($countPath) && is_file($countDatePath)){

        $countDateFileOpen = fopen($countDatePath, 'r');
        $lineCountDate = fgets($countDateFileOpen);
        $monthNow = date('n');
        $monthLastCount = date('n', $lineCountDate);
        $monthDiff = $monthNow - $monthLastCount;

        if ($monthDiff != 0) {//pas le même mois
            $countFileOpen = fopen($countPath, 'r');
            $textToFile = '';

            if ($monthDiff == 1 || $monthDiff == -11) { // le mois suivant
                while (($line = fgets($countFileOpen)) !== false) {
                    $array = explode('; ', rtrim($line));
                    $array[2] = $array[3];
                    $array[3] = 0;
                    $textToFile = $textToFile . implode('; ', $array) . "\n";
                }
            } else { // plus qu'un mois !
                while (($line = fgets($countFileOpen)) !== false) {
                    $array = explode('; ', rtrim($line));
                    $array[2] = 0;
                    $array[3] = 0;
                    $textToFile = $textToFile . implode('; ', $array) . "\n";
                }
            }
            fclose($countFileOpen);
            file_put_contents($countPath, $textToFile);
        }

        fclose($countDateFileOpen);
        $lastCountDate = time();

        $countFileOpen = fopen($countPath, 'r');
        $textToFile = '';
        $found = false;
        while (($line = fgets($countFileOpen)) !== false) {
            $array = explode('; ', rtrim($line));
        
            if ($array[0]== $filter) {
                $array[1] = $array[1] + 1;
                $visits = $array[1];

                $lastMonthVisits = $array[2];

                $array[3] = $array[3] + 1;
                $monthVisits = $array[3];
                $found = true;
            }    

            $textToFile = $textToFile . implode('; ', $array) . "\n";
        }
        
        if ($found !== true) {
            $page = $filter . '; 1; 0; 1';
            $textToFile = $textToFile . $page . "\n";
        }
        
        fclose($countFileOpen);
    } else {
        $page = $filter . '; 1; 0; 1';
        $textToFile = $page . "\n";
        $lastCountDate = time();
    }
    
    file_put_contents($countDatePath, $lastCountDate);
    file_put_contents($countPath, $textToFile);
}

if ($demoMode) {
    $statusText = 'demo-mode';
    $path = $demoPath;
} else if ($status == 0) {
    $statusText = 'no-update';
} else if ($status >= 10) {
    $statusText = 'failed';
} else {
    $statusText = 'update';
}

echo $statusText . '; ' . $path  . '; ' . $visits . '; ' . $lastMonthVisits . '; ' . $monthVisits . '; ' . $date;

function getAPI ($saveTo, $url, $status) {
    $fp = false;
    $fp = fopen($saveTo, 'c+');   

    // $fp still is false, something went wrong :
    if ($fp === false) {
        $status = $status + 10;
    } else {
        //Create a cURL handle
        $ch = curl_init($url);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);  
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        $output = curl_exec($ch); 

        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);
        fclose($fp);

        if ($statusCode == 200 && (strlen($output) > 10)) {
            file_put_contents($saveTo, $output);
            $status = $status + 1;
        } else {
            $status = $status + 10; 
        }
        return $status;
    }
}
?>