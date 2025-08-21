<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFacilityTable extends Migration
{
    public function up()
    {
        Schema::create('facility', function (Blueprint $table) {
            $table->id('fcy_0');  // cle primaire
            $table->string('fcynam_0'); // nom du site
            $table->string('cpy_0', 10); // code compagnie ('208')
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('facility');
    }
}
