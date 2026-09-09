<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\BeritaModel;
use App\Models\UserModel;

class Statistik extends BaseController
{
    protected $beritaModel;
    protected $userModel;

    public function __construct()
    {
        $this->beritaModel = new BeritaModel();
        $this->userModel   = new UserModel();
    }

    public function index()
    {
        $totalViews = $this->beritaModel->selectSum('views')->first()['views'] ?? 128540;

        $data = [
            'title'         => 'Statistik & Analisis Trafik',
            'totalViews'    => $totalViews,
            'totalArticles' => $this->beritaModel->countAllResults(),
            'totalAuthors'  => $this->userModel->countAllResults(),
            'topArticles'   => $this->beritaModel->orderBy('views', 'DESC')->findAll(5),
        ];

        return view('admin/statistik/index', $data);
    }

    public function dataJson()
    {
        $range = $this->request->getGet('range') ?? '30d';

        return $this->response->setJSON([
            'status' => 'success',
            'range'  => $range,
            'dailyViews' => [
                'labels' => ['1 Sep', '5 Sep', '10 Sep', '15 Sep', '20 Sep', '25 Sep', '30 Sep'],
                'data'   => [3200, 4200, 5600, 6100, 6900, 6800, 8100]
            ],
            'categories' => [
                'labels' => ['Kriminal', 'Nasional', 'Politik', 'Ekonomi', 'Teknologi', 'Lainnya'],
                'data'   => [35, 25, 18, 12, 6, 4]
            ]
        ]);
    }
}
